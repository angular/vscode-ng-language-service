/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript/lib/tsserverlibrary';
import * as lsp from 'vscode-languageserver';

import * as notification from '../../common/out/notifications';

import {tsCompletionEntryToLspCompletionItem} from './completion';
import {tsDiagnosticToLspDiagnostic} from './diagnostic';
import {Logger} from './logger';
import {ServerHost} from './server_host';
import {filePathToUri, lspPositionToTsPosition, lspRangeToTsPositions, tsTextSpanToLspRange, uriToFilePath} from './utils';

export interface SessionOptions {
  host: ServerHost;
  logger: Logger;
  ngPlugin: string;
  ngProbeLocation: string;
}

enum LanguageId {
  TS = 'typescript',
  HTML = 'html',
}

// Empty definition range for files without `scriptInfo`
const EMPTY_RANGE = lsp.Range.create(0, 0, 0, 0);

/**
 * Session is a wrapper around lsp.IConnection, with all the necessary protocol
 * handlers installed for Angular language service.
 */
export class Session {
  private readonly connection: lsp.IConnection;
  private readonly projectService: ts.server.ProjectService;
  private readonly logger: Logger;
  private diagnosticsTimeout: NodeJS.Timeout|null = null;
  private isProjectLoading = false;

  constructor(options: SessionOptions) {
    this.logger = options.logger;
    // Create a connection for the server. The connection uses Node's IPC as a transport.
    this.connection = lsp.createConnection();
    this.addProtocolHandlers(this.connection);
    this.projectService = this.createProjectService(options);
  }

  private createProjectService(options: SessionOptions): ts.server.ProjectService {
    const projSvc = new ts.server.ProjectService({
      host: options.host,
      logger: options.logger,
      cancellationToken: ts.server.nullCancellationToken,
      useSingleInferredProject: true,
      useInferredProjectPerProjectRoot: true,
      typingsInstaller: ts.server.nullTypingsInstaller,
      // Not supressing diagnostic events can cause a type error to be thrown when the
      // language server session gets an event for a file that is outside the project
      // managed by the project service, and for which a program does not exist in the
      // corresponding project's language service.
      // See https://github.com/angular/vscode-ng-language-service/issues/693
      suppressDiagnosticEvents: true,
      eventHandler: (e) => this.handleProjectServiceEvent(e),
      globalPlugins: [options.ngPlugin],
      pluginProbeLocations: [options.ngProbeLocation],
      allowLocalPluginLoads: false,  // do not load plugins from tsconfig.json
    });

    projSvc.setHostConfiguration({
      formatOptions: projSvc.getHostFormatCodeOptions(),
      extraFileExtensions: [
        {
          extension: '.html',
          isMixedContent: false,
          scriptKind: ts.ScriptKind.External,
        },
      ],
    });

    projSvc.configurePlugin({
      pluginName: options.ngPlugin,
      configuration: {
        angularOnly: true,
      },
    });

    return projSvc;
  }

  private addProtocolHandlers(conn: lsp.IConnection) {
    conn.onInitialize(p => this.onInitialize(p));
    conn.onDidOpenTextDocument(p => this.onDidOpenTextDocument(p));
    conn.onDidCloseTextDocument(p => this.onDidCloseTextDocument(p));
    conn.onDidChangeTextDocument(p => this.onDidChangeTextDocument(p));
    conn.onDidSaveTextDocument(p => this.onDidSaveTextDocument(p));
    conn.onDefinition(p => this.onDefinition(p));
    conn.onTypeDefinition(p => this.onTypeDefinition(p));
    conn.onHover(p => this.onHover(p));
    conn.onCompletion(p => this.onCompletion(p));
  }

  /**
   * An event handler that gets invoked whenever the program changes and
   * TS ProjectService sends `ProjectUpdatedInBackgroundEvent`. This particular
   * event is used to trigger diagnostic checks.
   * @param event
   */
  private handleProjectServiceEvent(event: ts.server.ProjectServiceEvent) {
    switch (event.eventName) {
      case ts.server.ProjectLoadingStartEvent:
        this.isProjectLoading = true;
        this.connection.sendNotification(notification.ProjectLoadingStart);
        this.logger.info(`Loading new project: ${event.data.reason}`);
        break;
      case ts.server.ProjectLoadingFinishEvent: {
        const {project} = event.data;
        try {
          // Disable language service if project is not Angular
          this.checkIsAngularProject(project);
        } finally {
          if (this.isProjectLoading) {
            this.isProjectLoading = false;
            this.connection.sendNotification(notification.ProjectLoadingFinish);
          }
        }
        break;
      }
      case ts.server.ProjectsUpdatedInBackgroundEvent:
        // ProjectsUpdatedInBackgroundEvent is sent whenever diagnostics are
        // requested via project.refreshDiagnostics()
        this.triggerDiagnostics(event.data.openFiles);
        break;
    }
  }

  /**
   * Retrieve Angular diagnostics for the specified `openFiles` after a specific
   * `delay`, or renew the request if there's already a pending one.
   * @param openFiles
   * @param delay time to wait before sending request (milliseconds)
   */
  private triggerDiagnostics(openFiles: string[], delay: number = 200) {
    // Do not immediately send a diagnostics request. Send only after user has
    // stopped typing after the specified delay.
    if (this.diagnosticsTimeout) {
      // If there's an existing timeout, cancel it
      clearTimeout(this.diagnosticsTimeout);
    }
    // Set a new timeout
    this.diagnosticsTimeout = setTimeout(() => {
      this.diagnosticsTimeout = null;  // clear the timeout
      this.sendPendingDiagnostics(openFiles);
      // Default delay is 200ms, consistent with TypeScript. See
      // https://github.com/microsoft/vscode/blob/7b944a16f52843b44cede123dd43ae36c0405dfd/extensions/typescript-language-features/src/features/bufferSyncSupport.ts#L493)
    }, delay);
  }

  /**
   * Execute diagnostics request for each of the specified `openFiles`.
   * @param openFiles
   */
  private sendPendingDiagnostics(openFiles: string[]) {
    for (const fileName of openFiles) {
      const scriptInfo = this.projectService.getScriptInfo(fileName);
      if (!scriptInfo) {
        continue;
      }

      const ngLS = this.getDefaultLanguageService(scriptInfo);
      if (!ngLS) {
        continue;
      }

      const diagnostics = ngLS.getSemanticDiagnostics(fileName);
      // Need to send diagnostics even if it's empty otherwise editor state will
      // not be updated.
      this.connection.sendDiagnostics({
        uri: filePathToUri(fileName),
        diagnostics: diagnostics.map(d => tsDiagnosticToLspDiagnostic(d, scriptInfo)),
      });
    }
  }

  /**
   * Return the default project for the specified `scriptInfo` if it is already
   * a configured project. If not, attempt to find a relevant config file and
   * make that project its default. This method is to ensure HTML files always
   * belong to a configured project instead of the default behavior of being in
   * an inferred project.
   * @param scriptInfo
   */
  getDefaultProjectForScriptInfo(scriptInfo: ts.server.ScriptInfo): ts.server.Project|undefined {
    let project = this.projectService.getDefaultProjectForFile(
        scriptInfo.fileName,
        // ensureProject tries to find a default project for the scriptInfo if
        // it does not already have one. It is not needed here because we are
        // going to assign it a project below if it does not have one.
        false  // ensureProject
    );

    // TODO: verify that HTML files are attached to Inferred project by default.
    // If they are already part of a ConfiguredProject then the following is
    // not needed.
    if (!project || project.projectKind !== ts.server.ProjectKind.Configured) {
      const {configFileName} = this.projectService.openClientFile(scriptInfo.fileName);
      if (!configFileName) {
        // Failed to find a config file. There is nothing we could do.
        this.error(`No config file for ${scriptInfo.fileName}`);
        return;
      }
      project = this.projectService.findProject(configFileName);
      if (!project) {
        return;
      }
      scriptInfo.detachAllProjects();
      scriptInfo.attachToProject(project);
    }

    return project;
  }

  /**
   * Returns a language service for a default project created for the specified `scriptInfo`. If the
   * project does not support a language service, nothing is returned.
   */
  getDefaultLanguageService(scriptInfo: ts.server.ScriptInfo): ts.LanguageService|undefined {
    const project = this.getDefaultProjectForScriptInfo(scriptInfo);
    if (!project?.languageServiceEnabled) return;
    return project.getLanguageService();
  }

  private onInitialize(params: lsp.InitializeParams): lsp.InitializeResult {
    return {
      capabilities: {
        textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
        completionProvider: {
          // The server does not provide support to resolve additional information
          // for a completion item.
          resolveProvider: false,
          triggerCharacters: ['<', '.', '*', '[', '(', '$', '|']
        },
        definitionProvider: true,
        typeDefinitionProvider: true,
        hoverProvider: true,
        workspace: {
          workspaceFolders: {supported: true},
        },
      },
    };
  }

  private onDidOpenTextDocument(params: lsp.DidOpenTextDocumentParams) {
    const {uri, languageId, text} = params.textDocument;
    const filePath = uriToFilePath(uri);
    if (!filePath) {
      return;
    }
    const scriptKind = languageId === LanguageId.TS ? ts.ScriptKind.TS : ts.ScriptKind.External;
    try {
      // The content could be newer than that on disk. This could be due to
      // buffer in the user's editor which has not been saved to disk.
      // See https://github.com/angular/vscode-ng-language-service/issues/632
      const result = this.projectService.openClientFile(filePath, text, scriptKind);

      const {configFileName, configFileErrors} = result;
      if (configFileErrors && configFileErrors.length) {
        // configFileErrors is an empty array even if there's no error, so check length.
        this.error(configFileErrors.map(e => e.messageText).join('\n'));
      }
      const project = configFileName ?
          this.projectService.findProject(configFileName) :
          this.projectService.getScriptInfo(filePath)?.containingProjects.find(isConfiguredProject);
      if (!project) {
        this.error(`Failed to find project for ${filePath}`);
        return;
      }
      if (project.languageServiceEnabled) {
        project.refreshDiagnostics();  // Show initial diagnostics
      }
    } catch (error) {
      if (this.isProjectLoading) {
        this.isProjectLoading = false;
        this.connection.sendNotification(notification.ProjectLoadingFinish);
      }
      if (error.stack) {
        this.error(error.stack);
      }
      throw error;
    }
  }

  private onDidCloseTextDocument(params: lsp.DidCloseTextDocumentParams) {
    const {textDocument} = params;
    const filePath = uriToFilePath(textDocument.uri);
    if (!filePath) {
      return;
    }
    this.projectService.closeClientFile(filePath);
  }

  private onDidChangeTextDocument(params: lsp.DidChangeTextDocumentParams) {
    const {contentChanges, textDocument} = params;
    const filePath = uriToFilePath(textDocument.uri);
    if (!filePath) {
      return;
    }
    const scriptInfo = this.projectService.getScriptInfo(filePath);
    if (!scriptInfo) {
      this.error(`Failed to get script info for ${filePath}`);
      return;
    }
    for (const change of contentChanges) {
      if ('range' in change) {
        const [start, end] = lspRangeToTsPositions(scriptInfo, change.range);
        scriptInfo.editContent(start, end, change.text);
      } else {
        // New text is considered to be the full content of the document.
        scriptInfo.editContent(0, scriptInfo.getSnapshot().getLength(), change.text);
      }
    }

    const project = this.getDefaultProjectForScriptInfo(scriptInfo);
    if (!project || !project.languageServiceEnabled) {
      return;
    }
    project.refreshDiagnostics();
  }

  private onDidSaveTextDocument(params: lsp.DidSaveTextDocumentParams) {
    const {text, textDocument} = params;
    const filePath = uriToFilePath(textDocument.uri);
    const scriptInfo = this.projectService.getScriptInfo(filePath);
    if (!scriptInfo) {
      return;
    }
    if (text) {
      scriptInfo.open(text);
    } else {
      scriptInfo.reloadFromFile();
    }
  }

  private onDefinition(params: lsp.TextDocumentPositionParams): lsp.LocationLink[]|undefined {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return;
    }
    const {languageService, scriptInfo} = lsInfo;
    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const definition = languageService.getDefinitionAndBoundSpan(scriptInfo.fileName, offset);
    if (!definition || !definition.definitions) {
      return;
    }
    const originSelectionRange = tsTextSpanToLspRange(scriptInfo, definition.textSpan);
    return this.tsDefinitionsToLspLocationLinks(definition.definitions, originSelectionRange);
  }

  private onTypeDefinition(params: lsp.TextDocumentPositionParams): lsp.LocationLink[]|undefined {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return;
    }
    const {languageService, scriptInfo} = lsInfo;
    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const definitions = languageService.getTypeDefinitionAtPosition(scriptInfo.fileName, offset);
    if (!definitions) {
      return;
    }
    return this.tsDefinitionsToLspLocationLinks(definitions);
  }

  private tsDefinitionsToLspLocationLinks(
      definitions: readonly ts.DefinitionInfo[],
      originSelectionRange?: lsp.Range): lsp.LocationLink[] {
    const results: lsp.LocationLink[] = [];
    for (const d of definitions) {
      const scriptInfo = this.projectService.getScriptInfo(d.fileName);

      // Some definitions, like definitions of CSS files, may not be recorded files with a
      // `scriptInfo` but are still valid definitions because they are files that exist. In this
      // case, check to make sure that the text span of the definition is zero so that the file
      // doesn't have to be read; if the span is non-zero, we can't do anything with this
      // definition.
      if (!scriptInfo && d.textSpan.length > 0) {
        continue;
      }
      const range = scriptInfo ? tsTextSpanToLspRange(scriptInfo, d.textSpan) : EMPTY_RANGE;

      const targetUri = filePathToUri(d.fileName);
      results.push({
        originSelectionRange,
        targetUri,
        targetRange: range,
        targetSelectionRange: range,
      });
    }
    return results;
  }

  private getLSAndScriptInfo(textDocument: lsp.TextDocumentIdentifier):
      {languageService: ts.LanguageService, scriptInfo: ts.server.ScriptInfo}|undefined {
    const filePath = uriToFilePath(textDocument.uri);
    const scriptInfo = this.projectService.getScriptInfo(filePath);
    if (!scriptInfo) {
      this.error(`Script info not found for ${filePath}`);
      return;
    }

    const languageService = this.getDefaultLanguageService(scriptInfo);
    if (!languageService) {
      return;
    }

    return {languageService, scriptInfo};
  }

  private onHover(params: lsp.TextDocumentPositionParams) {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return;
    }
    const {languageService, scriptInfo} = lsInfo;
    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const info = languageService.getQuickInfoAtPosition(scriptInfo.fileName, offset);
    if (!info) {
      return;
    }
    const {kind, kindModifiers, textSpan, displayParts, documentation} = info;
    let desc = kindModifiers ? kindModifiers + ' ' : '';
    if (displayParts) {
      // displayParts does not contain info about kindModifiers
      // but displayParts does contain info about kind
      desc += displayParts.map(dp => dp.text).join('');
    } else {
      desc += kind;
    }
    const contents: lsp.MarkedString[] = [{
      language: 'typescript',
      value: desc,
    }];
    if (documentation) {
      for (const d of documentation) {
        contents.push(d.text);
      }
    }
    return {
      contents,
      range: tsTextSpanToLspRange(scriptInfo, textSpan),
    };
  }

  private onCompletion(params: lsp.CompletionParams) {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return;
    }
    const {languageService, scriptInfo} = lsInfo;
    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const completions = languageService.getCompletionsAtPosition(
        scriptInfo.fileName, offset,
        {
            // options
        });
    if (!completions) {
      return;
    }
    return completions.entries.map(
        (e) => tsCompletionEntryToLspCompletionItem(e, params.position, scriptInfo));
  }

  /**
   * Show an error message in the remote console and log to file.
   *
   * @param message The message to show.
   */
  error(message: string): void {
    this.connection.console.error(message);
    this.logger.msg(message, ts.server.Msg.Err);
  }

  /**
   * Show a warning message in the remote console and log to file.
   *
   * @param message The message to show.
   */
  warn(message: string): void {
    this.connection.console.warn(message);
    // ts.server.Msg does not have warning level, so log as info.
    this.logger.msg(`[WARN] ${message}`, ts.server.Msg.Info);
  }

  /**
   * Show an information message in the remote console and log to file.
   *
   * @param message The message to show.
   */
  info(message: string): void {
    this.connection.console.info(message);
    this.logger.msg(message, ts.server.Msg.Info);
  }

  /**
   * Start listening on the input stream for messages to process.
   */
  listen() {
    this.connection.listen();
  }

  /**
   * Determine if the specified `project` is Angular, and disable the language
   * service if not.
   * @param project
   */
  private checkIsAngularProject(project: ts.server.Project) {
    const NG_CORE = '@angular/core/core.d.ts';
    const {projectName} = project;
    if (!project.languageServiceEnabled) {
      this.info(
          `Language service is already disabled for ${projectName}. ` +
          `This could be due to non-TS files that exceeded the size limit (${
              ts.server.maxProgramSizeForNonTsFiles} bytes).` +
          `Please check log file for details.`);

      return;
    }
    if (!isAngularProject(project, NG_CORE)) {
      project.disableLanguageService();
      this.info(
          `Disabling language service for ${projectName} because it is not an Angular project ` +
          `('${NG_CORE}' could not be found). ` +
          `If you believe you are seeing this message in error, please reinstall the packages in your package.json.`);

      if (project.getExcludedFiles().some(f => f.endsWith(NG_CORE))) {
        this.info(
            `Please check your tsconfig.json to make sure 'node_modules' directory is not excluded.`);
      }

      return;
    }

    // The language service should be enabled at this point.
    this.info(`Enabling language service for ${projectName}.`);
  }
}

/**
 * Return true if the specified `project` contains the Angular core declaration.
 * @param project
 * @param ngCore path that uniquely identifies `@angular/core`.
 */
function isAngularProject(project: ts.server.Project, ngCore: string): boolean {
  project.markAsDirty();  // Must mark project as dirty to rebuild the program.
  if (project.isNonTsProject()) {
    return false;
  }
  for (const fileName of project.getFileNames()) {
    if (fileName.endsWith(ngCore)) {
      return true;
    }
  }
  return false;
}

function isConfiguredProject(project: ts.server.Project): project is ts.server.ConfiguredProject {
  return project.projectKind === ts.server.ProjectKind.Configured;
}

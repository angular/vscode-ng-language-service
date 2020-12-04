/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgLanguageService} from '@angular/language-service';
import * as ts from 'typescript/lib/tsserverlibrary';
import * as lsp from 'vscode-languageserver/node';

import {ServerOptions} from '../common/initialize';
import {ProjectLanguageService, ProjectLoadingFinish, ProjectLoadingStart, SuggestIvyLanguageService, SuggestStrictMode} from '../common/notifications';
import {NgccProgressToken, NgccProgressType} from '../common/progress';
import {GetTcbParams, GetTcbRequest, GetTcbResponse} from '../common/requests';

import {readNgCompletionData, tsCompletionEntryToLspCompletionItem} from './completion';
import {tsDiagnosticToLspDiagnostic} from './diagnostic';
import {resolveAndRunNgcc} from './ngcc';
import {ServerHost} from './server_host';
import {filePathToUri, isConfiguredProject, lspPositionToTsPosition, lspRangeToTsPositions, tsTextSpanToLspRange, uriToFilePath} from './utils';
import {resolve, Version} from './version_provider';

export interface SessionOptions {
  host: ServerHost;
  logger: ts.server.Logger;
  ngPlugin: string;
  resolvedNgLsPath: string;
  ivy: boolean;
  logToConsole: boolean;
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
  private readonly connection: lsp.Connection;
  private readonly projectService: ts.server.ProjectService;
  private readonly logger: ts.server.Logger;
  private readonly angularCoreVersionMap = new WeakMap<ts.server.Project, Version>();
  private readonly ivy: boolean;
  private readonly configuredProjToExternalProj = new Map<string, string>();
  private readonly logToConsole: boolean;
  private diagnosticsTimeout: NodeJS.Timeout|null = null;
  private isProjectLoading = false;
  /**
   * Tracks which `ts.server.Project`s have the renaming capability disabled.
   *
   * If we detect the compiler options diagnostic that suggests enabling strict mode, we want to
   * disable renaming because we know that there are many cases where it will not work correctly.
   */
  private renameDisabledProjects: WeakSet<ts.server.Project> = new WeakSet();

  constructor(options: SessionOptions) {
    this.logger = options.logger;
    this.ivy = options.ivy;
    this.logToConsole = options.logToConsole;
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
      pluginProbeLocations: [options.resolvedNgLsPath],
      allowLocalPluginLoads: false,  // do not load plugins from tsconfig.json
    });

    projSvc.setHostConfiguration({
      formatOptions: projSvc.getHostFormatCodeOptions(),
      extraFileExtensions: [
        {
          // TODO: in View Engine getExternalFiles() returns a list of external
          // templates (HTML files). This configuration is no longer needed in
          // Ivy because Ivy returns the typecheck files.
          extension: '.html',
          isMixedContent: false,
          scriptKind: ts.ScriptKind.Unknown,
        },
      ],
      preferences: {
        // We don't want the AutoImportProvider projects to be created. See
        // https://devblogs.microsoft.com/typescript/announcing-typescript-4-0/#smarter-auto-imports
        includePackageJsonAutoImports: 'off',
      },
    });

    projSvc.configurePlugin({
      pluginName: options.ngPlugin,
      configuration: {
        angularOnly: true,
      },
    });

    return projSvc;
  }

  private addProtocolHandlers(conn: lsp.Connection) {
    conn.onInitialize(p => this.onInitialize(p));
    conn.onDidOpenTextDocument(p => this.onDidOpenTextDocument(p));
    conn.onDidCloseTextDocument(p => this.onDidCloseTextDocument(p));
    conn.onDidChangeTextDocument(p => this.onDidChangeTextDocument(p));
    conn.onDidSaveTextDocument(p => this.onDidSaveTextDocument(p));
    conn.onDefinition(p => this.onDefinition(p));
    conn.onTypeDefinition(p => this.onTypeDefinition(p));
    conn.onReferences(p => this.onReferences(p));
    conn.onRenameRequest(p => this.onRenameRequest(p));
    conn.onPrepareRename(p => this.onPrepareRename(p));
    conn.onHover(p => this.onHover(p));
    conn.onCompletion(p => this.onCompletion(p));
    conn.onCompletionResolve(p => this.onCompletionResolve(p));
    conn.onRequest(GetTcbRequest, p => this.onGetTcb(p));
  }

  private onGetTcb(params: GetTcbParams): GetTcbResponse|undefined {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return undefined;
    }
    const {languageService, scriptInfo} = lsInfo;
    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const response = languageService.getTcb(scriptInfo.fileName, offset);
    if (response === undefined) {
      return undefined;
    }
    const {fileName: tcfName} = response;
    const tcfScriptInfo = this.projectService.getScriptInfo(tcfName);
    if (!tcfScriptInfo) {
      return undefined;
    }
    return {
      uri: filePathToUri(tcfName),
      content: response.content,
      selections: response.selections.map((span => tsTextSpanToLspRange(tcfScriptInfo, span))),
    };
  }

  private async runNgcc(configFilePath: string) {
    this.connection.sendProgress(NgccProgressType, NgccProgressToken, {
      done: false,
      configFilePath,
      message: `Running ngcc for project ${configFilePath}`,
    });

    let success = false;

    try {
      await resolveAndRunNgcc(configFilePath, {
        report: (msg: string) => {
          this.connection.sendProgress(NgccProgressType, NgccProgressToken, {
            done: false,
            configFilePath,
            message: msg,
          });
        },
      });
      success = true;
    } catch (e) {
      this.error(
          `Failed to run ngcc for ${configFilePath}:\n` +
          `    ${e.message}\n` +
          `    Language service will remain disabled.`);
    } finally {
      this.connection.sendProgress(NgccProgressType, NgccProgressToken, {
        done: true,
        configFilePath,
        success,
      });
    }

    // Re-enable language service even if ngcc fails, because users could fix
    // the problem by running ngcc themselves. If we keep language service
    // disabled, there's no way users could use the extension even after
    // resolving ngcc issues. On the client side, we will warn users about
    // potentially degraded experience.

    this.reenableLanguageServiceForProject(configFilePath);
  }

  private reenableLanguageServiceForProject(configFilePath: string) {
    const project = this.projectService.findProject(configFilePath);
    if (!project) {
      this.error(
          `Failed to find project for ${configFilePath} returned by ngcc.\n` +
          `Language service will remain disabled.`);
      return;
    }
    project.enableLanguageService();
    // When the language service got disabled, the program was discarded via
    // languageService.cleanupSemanticCache(). However, the program is not
    // recreated when the language service is re-enabled. We manually mark the
    // project as dirty to force update the graph.
    project.markAsDirty();
    this.info(`Enabling Ivy language service for ${project.projectName}.`);
    this.handleCompilerOptionsDiagnostics(project);
    // Send diagnostics since we skipped this step when opening the file
    // (because language service was disabled while waiting for ngcc).
    // First, make sure the Angular project is complete.
    this.runGlobalAnalysisForNewlyLoadedProject(project);
    project.refreshDiagnostics();  // Show initial diagnostics
  }

  /**
   * Invoke the compiler for the first time so that external templates get
   * matched to the project they belong to.
   */
  private runGlobalAnalysisForNewlyLoadedProject(project: ts.server.Project) {
    if (!project.hasRoots()) {
      return;
    }
    const fileName = project.getRootScriptInfos()[0].fileName;
    // Getting semantic diagnostics will trigger a global analysis.
    project.getLanguageService().getSemanticDiagnostics(fileName);
  }

  private handleCompilerOptionsDiagnostics(project: ts.server.Project) {
    if (!isConfiguredProject(project)) {
      return;
    }

    const diags = project.getLanguageService().getCompilerOptionsDiagnostics();
    const suggestStrictModeDiag = diags.find(d => d.code === -9910001);

    if (suggestStrictModeDiag) {
      const configFilePath: string = project.getConfigFilePath();
      this.connection.sendNotification(SuggestStrictMode, {
        configFilePath,
        message: suggestStrictModeDiag.messageText,
      });
      this.renameDisabledProjects.add(project);
    } else {
      this.renameDisabledProjects.delete(project);
    }
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
        this.connection.sendNotification(ProjectLoadingStart);
        this.logger.info(`Loading new project: ${event.data.reason}`);
        break;
      case ts.server.ProjectLoadingFinishEvent: {
        if (this.isProjectLoading) {
          this.isProjectLoading = false;
          this.connection.sendNotification(ProjectLoadingFinish);
        }
        this.checkProject(event.data.project);
        break;
      }
      case ts.server.ProjectsUpdatedInBackgroundEvent:
        // ProjectsUpdatedInBackgroundEvent is sent whenever diagnostics are
        // requested via project.refreshDiagnostics()
        this.triggerDiagnostics(event.data.openFiles);
        break;
      case ts.server.ProjectLanguageServiceStateEvent:
        this.connection.sendNotification(ProjectLanguageService, {
          projectName: event.data.project.getProjectName(),
          languageServiceEnabled: event.data.languageServiceEnabled,
        });
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
      const result = this.getLSAndScriptInfo(fileName);
      if (!result) {
        continue;
      }
      const diagnostics = result.languageService.getSemanticDiagnostics(fileName);
      // Need to send diagnostics even if it's empty otherwise editor state will
      // not be updated.
      this.connection.sendDiagnostics({
        uri: filePathToUri(fileName),
        diagnostics: diagnostics.map(d => tsDiagnosticToLspDiagnostic(d, result.scriptInfo)),
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
    this.createExternalProject(project);

    return project;
  }

  private onInitialize(params: lsp.InitializeParams): lsp.InitializeResult {
    const serverOptions: ServerOptions = {
      logFile: this.logger.getLogFileName(),
    };
    return {
      capabilities: {
        textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
        completionProvider: {
          // Only the Ivy LS provides support for additional completion resolution.
          resolveProvider: this.ivy,
          triggerCharacters: ['<', '.', '*', '[', '(', '$', '|']
        },
        definitionProvider: true,
        typeDefinitionProvider: this.ivy,
        referencesProvider: this.ivy,
        renameProvider: this.ivy ? {
          // Renames should be checked and tested before being executed.
          prepareProvider: true,
        } :
                                   false,
        hoverProvider: true,
        workspace: {
          workspaceFolders: {supported: true},
        },
      },
      serverOptions,
    };
  }

  private onDidOpenTextDocument(params: lsp.DidOpenTextDocumentParams) {
    const {uri, languageId, text} = params.textDocument;
    const filePath = uriToFilePath(uri);
    if (!filePath) {
      return;
    }
    // External templates (HTML files) should be tagged as ScriptKind.Unknown
    // so that they don't get parsed as TS files. See
    // https://github.com/microsoft/TypeScript/blob/b217f22e798c781f55d17da72ed099a9dee5c650/src/compiler/program.ts#L1897-L1899
    const scriptKind = languageId === LanguageId.TS ? ts.ScriptKind.TS : ts.ScriptKind.Unknown;
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
        return;
      }
      if (project.languageServiceEnabled) {
        project.refreshDiagnostics();  // Show initial diagnostics
      }
    } catch (error) {
      if (this.isProjectLoading) {
        this.isProjectLoading = false;
        this.connection.sendNotification(ProjectLoadingFinish);
      }
      if (error.stack) {
        this.error(error.stack);
      }
      throw error;
    }
    this.closeOrphanedExternalProjects();
  }

  /**
   * Creates an external project with the same config path as `project` so that TypeScript keeps the
   * project open when navigating away from `html` files.
   */
  private createExternalProject(project: ts.server.Project) {
    if (isConfiguredProject(project) &&
        !this.configuredProjToExternalProj.has(project.projectName)) {
      const extProjectName = `${project.projectName}-external`;
      project.projectService.openExternalProject({
        projectFileName: extProjectName,
        rootFiles: [{fileName: project.getConfigFilePath()}],
        options: {}
      });
      this.configuredProjToExternalProj.set(project.projectName, extProjectName);
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

  /**
   * We open external projects for files so that we can prevent TypeScript from closing a project
   * when there is open external HTML template that still references the project. This function
   * checks if there are no longer any open files in any external project. If there
   * aren't, we also close the external project that was created.
   */
  private closeOrphanedExternalProjects() {
    for (const [configuredProjName, externalProjName] of this.configuredProjToExternalProj) {
      const configuredProj = this.projectService.findProject(configuredProjName);
      if (!configuredProj || configuredProj.isClosed()) {
        this.projectService.closeExternalProject(externalProjName);
        this.configuredProjToExternalProj.delete(configuredProjName);
        continue;
      }
      // See if any openFiles belong to the configured project.
      // if not, close external project this.projectService.openFiles
      const openFiles = toArray(this.projectService.openFiles.keys());
      if (!openFiles.some(file => {
            const scriptInfo = this.projectService.getScriptInfo(file);
            return scriptInfo?.isAttached(configuredProj);
          })) {
        this.projectService.closeExternalProject(externalProjName);
        this.configuredProjToExternalProj.delete(configuredProjName);
      }
    }
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

  private onRenameRequest(params: lsp.RenameParams): lsp.WorkspaceEdit|undefined {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return;
    }
    const {languageService, scriptInfo} = lsInfo;
    if (scriptInfo.scriptKind === ts.ScriptKind.TS) {
      // Because we cannot ensure our extension is prioritized for renames in TS files (see
      // https://github.com/microsoft/vscode/issues/115354) we disable renaming completely so we can
      // provide consistent expectations.
      return;
    }
    const project = this.getDefaultProjectForScriptInfo(scriptInfo);
    if (project === undefined || this.renameDisabledProjects.has(project)) {
      return;
    }

    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const renameLocations = languageService.findRenameLocations(
        scriptInfo.fileName, offset, /*findInStrings*/ false, /*findInComments*/ false);
    if (renameLocations === undefined) {
      return;
    }

    const changes = renameLocations.reduce((changes, location) => {
      if (changes[location.fileName] === undefined) {
        changes[location.fileName] = [];
      }
      const fileEdits = changes[location.fileName];

      const lsInfo = this.getLSAndScriptInfo(location.fileName);
      if (lsInfo === undefined) {
        return changes;
      }
      const range = tsTextSpanToLspRange(lsInfo.scriptInfo, location.textSpan);
      fileEdits.push({range, newText: params.newName});
      return changes;
    }, {} as {[uri: string]: lsp.TextEdit[]});

    return {changes};
  }

  private onPrepareRename(params: lsp.PrepareRenameParams):
      {range: lsp.Range, placeholder: string}|undefined {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return;
    }
    const {languageService, scriptInfo} = lsInfo;
    if (scriptInfo.scriptKind === ts.ScriptKind.TS) {
      // Because we cannot ensure our extension is prioritized for renames in TS files (see
      // https://github.com/microsoft/vscode/issues/115354) we disable renaming completely so we can
      // provide consistent expectations.
      return;
    }
    const project = this.getDefaultProjectForScriptInfo(scriptInfo);
    if (project === undefined || this.renameDisabledProjects.has(project)) {
      return;
    }

    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const renameInfo = languageService.getRenameInfo(scriptInfo.fileName, offset);
    if (!renameInfo.canRename) {
      return undefined;
    }
    const range = tsTextSpanToLspRange(scriptInfo, renameInfo.triggerSpan);
    return {
      range,
      placeholder: renameInfo.displayName,
    };
  }

  private onReferences(params: lsp.TextDocumentPositionParams): lsp.Location[]|undefined {
    const lsInfo = this.getLSAndScriptInfo(params.textDocument);
    if (lsInfo === undefined) {
      return;
    }
    const {languageService, scriptInfo} = lsInfo;
    const offset = lspPositionToTsPosition(scriptInfo, params.position);
    const references = languageService.getReferencesAtPosition(scriptInfo.fileName, offset);
    if (references === undefined) {
      return;
    }
    return references.map(ref => {
      const scriptInfo = this.projectService.getScriptInfo(ref.fileName);
      const range = scriptInfo ? tsTextSpanToLspRange(scriptInfo, ref.textSpan) : EMPTY_RANGE;
      const uri = filePathToUri(ref.fileName);
      return {uri, range};
    });
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

  private getLSAndScriptInfo(textDocumentOrFileName: lsp.TextDocumentIdentifier|string):
      {languageService: NgLanguageService, scriptInfo: ts.server.ScriptInfo}|undefined {
    const filePath = lsp.TextDocumentIdentifier.is(textDocumentOrFileName) ?
        uriToFilePath(textDocumentOrFileName.uri) :
        textDocumentOrFileName;
    const scriptInfo = this.projectService.getScriptInfo(filePath);
    if (!scriptInfo) {
      this.error(`Script info not found for ${filePath}`);
      return;
    }

    const project = this.getDefaultProjectForScriptInfo(scriptInfo);
    if (!project?.languageServiceEnabled) {
      return;
    }
    if (project.isClosed()) {
      scriptInfo.detachFromProject(project);
      this.logger.info(`Failed to get language service for closed project ${project.projectName}.`);
      return undefined;
    }
    return {
      languageService: project.getLanguageService() as NgLanguageService,
      scriptInfo,
    };
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

  private onCompletionResolve(item: lsp.CompletionItem): lsp.CompletionItem {
    const data = readNgCompletionData(item);
    if (data === null) {
      // This item wasn't tagged with Angular LS completion data - it probably didn't originate
      // from this language service.
      return item;
    }

    const {filePath, position} = data;
    const lsInfo = this.getLSAndScriptInfo(filePath);
    if (lsInfo === undefined) {
      return item;
    }
    const {languageService, scriptInfo} = lsInfo;

    const offset = lspPositionToTsPosition(scriptInfo, position);
    const details = languageService.getCompletionEntryDetails(
        filePath, offset, item.insertText ?? item.label, undefined, undefined, undefined);
    if (details === undefined) {
      return item;
    }

    const {kind, kindModifiers, displayParts, documentation} = details;
    let desc = kindModifiers ? kindModifiers + ' ' : '';
    if (displayParts) {
      // displayParts does not contain info about kindModifiers
      // but displayParts does contain info about kind
      desc += displayParts.map(dp => dp.text).join('');
    } else {
      desc += kind;
    }
    item.detail = desc;
    item.documentation = documentation?.map(d => d.text).join('');
    return item;
  }

  /**
   * Show an error message in the remote console and log to file.
   *
   * @param message The message to show.
   */
  error(message: string): void {
    if (this.logToConsole) {
      this.connection.console.error(message);
    }
    this.logger.msg(message, ts.server.Msg.Err);
  }

  /**
   * Show a warning message in the remote console and log to file.
   *
   * @param message The message to show.
   */
  warn(message: string): void {
    if (this.logToConsole) {
      this.connection.console.warn(message);
    }
    // ts.server.Msg does not have warning level, so log as info.
    this.logger.msg(`[WARN] ${message}`, ts.server.Msg.Info);
  }

  /**
   * Show an information message in the remote console and log to file.
   *
   * @param message The message to show.
   */
  info(message: string): void {
    if (this.logToConsole) {
      this.connection.console.info(message);
    }
    this.logger.msg(message, ts.server.Msg.Info);
  }

  /**
   * Start listening on the input stream for messages to process.
   */
  listen() {
    this.connection.listen();
  }

  /**
   * Disable the language service if the specified `project` is not Angular or
   * Ivy mode is enabled.
   */
  private checkProject(project: ts.server.Project) {
    const {projectName} = project;
    if (!project.languageServiceEnabled) {
      this.info(
          `Language service is already disabled for ${projectName}. ` +
          `This could be due to non-TS files that exceeded the size limit (${
              ts.server.maxProgramSizeForNonTsFiles} bytes).` +
          `Please check log file for details.`);

      return;
    }

    const coreDts = this.checkIsAngularProject(project);
    if (coreDts === undefined) {
      return;
    }

    if (this.ivy && isConfiguredProject(project)) {
      // Keep language service disabled until ngcc is completed.
      project.disableLanguageService();
      // Do not wait on this promise otherwise we'll be blocking other requests
      this.runNgcc(project.getConfigFilePath()).catch((error: Error) => {
        this.error(error.toString());
      });
    } else {
      // Immediately enable Legacy/ViewEngine language service
      this.info(`Enabling VE language service for ${projectName}.`);
      this.promptToEnableIvyIfAvailable(project, coreDts);
    }
  }

  private promptToEnableIvyIfAvailable(
      project: ts.server.Project, coreDts: ts.server.NormalizedPath) {
    let angularCoreVersion = this.angularCoreVersionMap.get(project);
    if (angularCoreVersion === undefined) {
      angularCoreVersion = resolve('@angular/core', coreDts)?.version;
    }

    if (angularCoreVersion !== undefined && !this.ivy && angularCoreVersion.major >= 9) {
      this.connection.sendNotification(SuggestIvyLanguageService, {
        message:
            'Would you like to enable the new Ivy-native language service to get the latest features and bug fixes?',
      });
    }
  }

  /**
   * Determine if the specified `project` is Angular, and disable the language
   * service if not.
   *
   * @returns The `ts.server.NormalizedPath` to the `@angular/core/core.d.ts` file.
   */
  private checkIsAngularProject(project: ts.server.Project): ts.server.NormalizedPath|undefined {
    const {projectName} = project;
    const NG_CORE = '@angular/core/core.d.ts';
    const ngCoreDts = project.getFileNames().find(f => f.endsWith(NG_CORE));
    const isAngularProject =
        project.hasRoots() && !project.isNonTsProject() && ngCoreDts !== undefined;

    if (isAngularProject) {
      return ngCoreDts;
    }

    project.disableLanguageService();
    this.info(
        `Disabling language service for ${projectName} because it is not an Angular project ` +
        `('${NG_CORE}' could not be found). ` +
        `If you believe you are seeing this message in error, please reinstall the packages in your package.json.`);

    if (project.getExcludedFiles().some(f => f.endsWith(NG_CORE))) {
      this.info(
          `Please check your tsconfig.json to make sure 'node_modules' directory is not excluded.`);
    }

    return undefined;
  }
}

function toArray<T>(it: ts.Iterator<T>): T[] {
  const results: T[] = [];
  for (let itResult = it.next(); !itResult.done; itResult = it.next()) {
    results.push(itResult.value);
  }
  return results;
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript/lib/tsserverlibrary';
import * as lsp from 'vscode-languageserver';

import {tsCompletionEntryToLspCompletionItem} from './completion';
import {tsDiagnosticToLspDiagnostic} from './diagnostic';
import {Logger} from './logger';
import {ProjectService} from './project_service';
import {projectLoadingNotification} from './protocol';
import {ServerHost} from './server_host';
import {filePathToUri, lspPositionToTsPosition, lspRangeToTsPositions, tsTextSpanToLspRange, uriToFilePath} from './utils';

export interface SessionOptions {
  host: ServerHost;
  logger: Logger;
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
  private readonly projectService: ProjectService;

  constructor(options: SessionOptions) {
    // Create a connection for the server. The connection uses Node's IPC as a transport.
    this.connection = lsp.createConnection();
    this.addProtocolHandlers(this.connection);
    this.projectService = new ProjectService({
      host: options.host,
      logger: options.logger,
      cancellationToken: ts.server.nullCancellationToken,
      useSingleInferredProject: true,
      useInferredProjectPerProjectRoot: true,
      typingsInstaller: ts.server.nullTypingsInstaller,
      suppressDiagnosticEvents: false,
      eventHandler: (e) => this.handleProjectServiceEvent(e),
      globalPlugins: ['@angular/language-service'],
      pluginProbeLocations: [options.ngProbeLocation],
      allowLocalPluginLoads: false,  // do not load plugins from tsconfig.json
    });
  }

  private addProtocolHandlers(conn: lsp.IConnection) {
    conn.onInitialize(p => this.onInitialize(p));
    conn.onDidOpenTextDocument(p => this.onDidOpenTextDocument(p));
    conn.onDidCloseTextDocument(p => this.onDidCloseTextDocument(p));
    conn.onDidChangeTextDocument(p => this.onDidChangeTextDocument(p));
    conn.onDidSaveTextDocument(p => this.onDidSaveTextDocument(p));
    conn.onDefinition(p => this.onDefinition(p));
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
        this.connection.sendNotification(
            projectLoadingNotification.start, event.data.project.projectName);
        break;
      case ts.server.ProjectLoadingFinishEvent: {
        const {project} = event.data;
        // https://github.com/angular/vscode-ng-language-service/issues/416
        // if (!isAngularProject(project)) {
        //   project.disableLanguageService();
        //   this.connection.console.info(`Disabling language service for ${
        //       project.projectName} because it is not an Angular project.`);
        // }
        this.connection.sendNotification(
            projectLoadingNotification.finish, event.data.project.projectName);
        break;
      }
      case ts.server.ProjectsUpdatedInBackgroundEvent:
        // ProjectsUpdatedInBackgroundEvent is sent whenever diagnostics are
        // requested via project.refreshDiagnostics()
        this.refreshDiagnostics(event.data.openFiles);
        break;
    }
  }

  /**
   * Retrieve Angular diagnostics for the specified `openFiles`.
   * @param openFiles
   */
  private refreshDiagnostics(openFiles: string[]) {
    for (const fileName of openFiles) {
      const scriptInfo = this.projectService.getScriptInfo(fileName);
      if (!scriptInfo) {
        continue;
      }
      const project = this.projectService.getDefaultProjectForScriptInfo(scriptInfo);
      if (!project || !project.languageServiceEnabled) {
        continue;
      }
      const ngLS = project.getLanguageService();
      const diagnostics = ngLS.getSemanticDiagnostics(fileName);
      // Need to send diagnostics even if it's empty otherwise editor state will
      // not be updated.
      this.connection.sendDiagnostics({
        uri: filePathToUri(fileName),
        diagnostics: diagnostics.map(d => tsDiagnosticToLspDiagnostic(d, scriptInfo)),
      });
    }
  }

  private onInitialize(params: lsp.InitializeParams): lsp.InitializeResult {
    return {
      capabilities: {
        textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
        completionProvider: {
          /// The server does not provide support to resolve additional information
          // for a completion item.
          resolveProvider: false,
          triggerCharacters: ['<', '.', '*', '[', '(']
        },
        definitionProvider: true,
        hoverProvider: true,
      },
    };
  }

  private onDidOpenTextDocument(params: lsp.DidOpenTextDocumentParams) {
    const {uri, text, languageId} = params.textDocument;
    const filePath = uriToFilePath(uri);
    if (!filePath) {
      return;
    }

    const scriptKind = languageId === LanguageId.TS ? ts.ScriptKind.TS : ts.ScriptKind.External;
    const result = this.projectService.openClientFile(filePath, text, scriptKind);

    const {configFileName, configFileErrors} = result;
    if (configFileErrors && configFileErrors.length) {
      // configFileErrors is an empty array even if there's no error, so check length.
      this.connection.console.error(configFileErrors.map(e => e.messageText).join('\n'));
    }
    if (!configFileName) {
      // TODO: This could happen if the first file opened is HTML. Fix this.
      this.connection.console.error(`No config file for ${filePath}`);
      return;
    }
    const project = this.projectService.findProject(configFileName);
    if (!project) {
      this.connection.console.error(`Failed to find project for ${filePath}`);
      return;
    }
    project.refreshDiagnostics();  // Show initial diagnostics
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
      this.connection.console.log(`Failed to get script info for ${filePath}`);
      return;
    }
    for (const change of contentChanges) {
      if (change.range) {
        const [start, end] = lspRangeToTsPositions(scriptInfo, change.range);
        scriptInfo.editContent(start, end, change.text);
      }
    }

    const project = this.projectService.getDefaultProjectForScriptInfo(scriptInfo);
    if (!project) {
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

  private onDefinition(params: lsp.TextDocumentPositionParams) {
    const {position, textDocument} = params;
    const filePath = uriToFilePath(textDocument.uri);
    const scriptInfo = this.projectService.getScriptInfo(filePath);
    if (!scriptInfo) {
      this.connection.console.log(`Script info not found for ${filePath}`);
      return;
    }

    const {fileName} = scriptInfo;
    const project = this.projectService.getDefaultProjectForScriptInfo(scriptInfo);
    if (!project || !project.languageServiceEnabled) {
      return;
    }

    const offset = lspPositionToTsPosition(scriptInfo, position);
    const langSvc = project.getLanguageService();
    const definition = langSvc.getDefinitionAndBoundSpan(fileName, offset);
    if (!definition || !definition.definitions) {
      return;
    }
    const originSelectionRange = tsTextSpanToLspRange(scriptInfo, definition.textSpan);
    const results: lsp.LocationLink[] = [];
    for (const d of definition.definitions) {
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

  private onHover(params: lsp.TextDocumentPositionParams) {
    const {position, textDocument} = params;
    const filePath = uriToFilePath(textDocument.uri);
    if (!filePath) {
      return;
    }
    const scriptInfo = this.projectService.getScriptInfo(filePath);
    if (!scriptInfo) {
      return;
    }
    const project = this.projectService.getDefaultProjectForScriptInfo(scriptInfo);
    if (!project || !project.languageServiceEnabled) {
      return;
    }
    const offset = lspPositionToTsPosition(scriptInfo, position);
    const langSvc = project.getLanguageService();
    const info = langSvc.getQuickInfoAtPosition(scriptInfo.fileName, offset);
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
    const {position, textDocument} = params;
    const filePath = uriToFilePath(textDocument.uri);
    if (!filePath) {
      return;
    }
    const scriptInfo = this.projectService.getScriptInfo(filePath);
    if (!scriptInfo) {
      return;
    }
    const {fileName} = scriptInfo;
    const project = this.projectService.getDefaultProjectForScriptInfo(scriptInfo);
    if (!project || !project.languageServiceEnabled) {
      return;
    }
    const offset = lspPositionToTsPosition(scriptInfo, position);
    const langSvc = project.getLanguageService();
    const completions = langSvc.getCompletionsAtPosition(
        fileName, offset,
        {
            // options
        });
    if (!completions) {
      return;
    }
    return completions.entries.map((e) => tsCompletionEntryToLspCompletionItem(e, position));
  }

  /**
   * Show an error message.
   *
   * @param message The message to show.
   */
  error(message: string): void {
    this.connection.console.error(message);
  }

  /**
   * Show a warning message.
   *
   * @param message The message to show.
   */
  warn(message: string): void {
    this.connection.console.warn(message);
  }

  /**
   * Show an information message.
   *
   * @param message The message to show.
   */
  info(message: string): void {
    this.connection.console.info(message);
  }

  /**
   * Log a message.
   *
   * @param message The message to log.
   */
  log(message: string): void {
    this.connection.console.log(message);
  }

  /**
   * Start listening on the input stream for messages to process.
   */
  listen() {
    this.connection.listen();
  }
}

/**
 * Return true if the specified `project` contains the Angular core declaration.
 * @param project
 */
function isAngularProject(project: ts.server.Project): boolean {
  project.markAsDirty();  // Must mark project as dirty to rebuild the program.
  if (project.isNonTsProject()) {
    return false;
  }
  for (const fileName of project.getFileNames()) {
    if (fileName.endsWith('@angular/core/core.d.ts')) {
      return true;
    }
  }
  return false;
}

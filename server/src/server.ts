/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript/lib/tsserverlibrary';  // used as value
import * as lsp from 'vscode-languageserver';

import {tsCompletionEntryToLspCompletionItem} from './completion';
import {createLogger} from './logger';
import {ProjectService} from './project_service';
import {ServerHost} from './server_host';
import {filePathToUri, lspPositionToTsPosition, lspRangeToTsPositions, tsTextSpanToLspRange, uriToFilePath} from './utils';

enum LanguageId {
  TS = 'typescript',
  HTML = 'html',
}

// Parse startup options
const options = new Map<string, string>();
for (let i = 0; i < process.argv.length; ++i) {
  const argv = process.argv[i];
  if (argv === '--logFile') {
    options.set('logFile', process.argv[i + 1]);
  }
  if (argv === '--logVerbosity') {
    options.set('logVerbosity', process.argv[i + 1]);
  }
}

// Create a connection for the server. The connection uses Node's IPC as a transport
const connection: lsp.IConnection = lsp.createConnection();

// logger logs to file. OK to emit verbose entries.
const logger = createLogger(options);
// ServerHost provides native OS functionality
const serverHost = new ServerHost();
// Our ProjectService is just a thin wrapper around TS's ProjectService
const projSvc = new ProjectService(serverHost, logger, connection, options);
const {tsProjSvc} = projSvc;

// Empty definition range for files without `scriptInfo`
const EMPTY_RANGE = lsp.Range.create(0, 0, 0, 0);

// Log initialization info
connection.console.info(`Log file: ${logger.getLogFileName()}`);
if (process.env.NG_DEBUG) {
  logger.info('Angular Language Service is under DEBUG mode');
}
if (process.env.TSC_NONPOLLING_WATCHER !== 'true') {
  connection.console.warn(
      `Using less efficient polling watcher. Set TSC_NONPOLLING_WATCHER to true.`);
}

// After the server has started the client sends an initilize request.
connection.onInitialize((params: lsp.InitializeParams): lsp.InitializeResult => {
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
});

connection.onDidOpenTextDocument((params: lsp.DidOpenTextDocumentParams) => {
  const {uri, text, languageId} = params.textDocument;
  const filePath = uriToFilePath(uri);
  if (!filePath) {
    return;
  }

  const scriptKind = languageId === LanguageId.TS ? ts.ScriptKind.TS : ts.ScriptKind.External;
  const result = tsProjSvc.openClientFile(filePath, text, scriptKind);

  const {configFileName, configFileErrors} = result;
  if (configFileErrors && configFileErrors.length) {
    connection.console.error(configFileErrors.map(e => e.messageText).join('\n'));
  }
  if (!configFileName) {
    // TODO: This could happen if the first file opened is HTML. Fix this.
    connection.console.error(`No config file for ${filePath}`);
    return;
  }
  const project = tsProjSvc.findProject(configFileName);
  if (!project) {
    connection.console.error(`Failed to find project for ${filePath}`);
    return;
  }
  project.markAsDirty();         // Must mark project as dirty to rebuild the program.
  project.refreshDiagnostics();  // Show initial diagnostics
});

connection.onDidCloseTextDocument((params: lsp.DidCloseTextDocumentParams) => {
  const {textDocument} = params;
  const filePath = uriToFilePath(textDocument.uri);
  if (!filePath) {
    return;
  }
  tsProjSvc.closeClientFile(filePath);
});

connection.onDidChangeTextDocument((params: lsp.DidChangeTextDocumentParams) => {
  const {contentChanges, textDocument} = params;
  const filePath = uriToFilePath(textDocument.uri);
  if (!filePath) {
    return;
  }
  const scriptInfo = tsProjSvc.getScriptInfo(filePath);
  if (!scriptInfo) {
    connection.console.log(`Failed to get script info for ${filePath}`);
    return;
  }
  for (const change of contentChanges) {
    if (change.range) {
      const [start, end] = lspRangeToTsPositions(scriptInfo, change.range);
      scriptInfo.editContent(start, end, change.text);
    }
  }

  const project = projSvc.getDefaultProjectForScriptInfo(scriptInfo);
  if (!project) {
    return;
  }
  project.refreshDiagnostics();
});

connection.onDidSaveTextDocument((params: lsp.DidSaveTextDocumentParams) => {
  const {text, textDocument} = params;
  const filePath = uriToFilePath(textDocument.uri);
  const scriptInfo = tsProjSvc.getScriptInfo(filePath);
  if (!scriptInfo) {
    return;
  }
  if (text) {
    scriptInfo.open(text);
  } else {
    scriptInfo.reloadFromFile();
  }
});

connection.onDefinition((params: lsp.TextDocumentPositionParams) => {
  const {position, textDocument} = params;
  const filePath = uriToFilePath(textDocument.uri);
  const scriptInfo = tsProjSvc.getScriptInfo(filePath);
  if (!scriptInfo) {
    connection.console.log(`Script info not found for ${filePath}`);
    return;
  }

  const {fileName} = scriptInfo;
  const project = projSvc.getDefaultProjectForScriptInfo(scriptInfo);
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
    const scriptInfo = tsProjSvc.getScriptInfo(d.fileName);

    // Some definitions, like definitions of CSS files, may not be recorded files with a
    // `scriptInfo` but are still valid definitions because they are files that exist. In this case,
    // check to make sure that the text span of the definition is zero so that the file doesn't have
    // to be read; if the span is non-zero, we can't do anything with this definition.
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
});

connection.onHover((params: lsp.TextDocumentPositionParams) => {
  const {position, textDocument} = params;
  const filePath = uriToFilePath(textDocument.uri);
  if (!filePath) {
    return;
  }
  const scriptInfo = tsProjSvc.getScriptInfo(filePath);
  if (!scriptInfo) {
    return;
  }
  const {fileName} = scriptInfo;
  const project = tsProjSvc.getDefaultProjectForFile(fileName, true /* ensureProject */);
  if (!project || !project.languageServiceEnabled) {
    return;
  }
  const offset = lspPositionToTsPosition(scriptInfo, position);
  const langSvc = project.getLanguageService();
  const info = langSvc.getQuickInfoAtPosition(fileName, offset);
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
});

// This handler provides the initial list of the completion items.
connection.onCompletion((params: lsp.CompletionParams) => {
  const {position, textDocument} = params;
  const filePath = uriToFilePath(textDocument.uri);
  if (!filePath) {
    return;
  }
  const scriptInfo = tsProjSvc.getScriptInfo(filePath);
  if (!scriptInfo) {
    return;
  }
  const {fileName} = scriptInfo;
  const project = projSvc.getDefaultProjectForScriptInfo(scriptInfo);
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
});

connection.listen();

/* --------------------------------------------------------------------------------------------
 * Portions Copyright (c) Microsoft Corporation. All rights reserved.
 * Portions Copyright (c) Google Inc. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference path="../node_modules/@types/node/index.d.ts" />

// Force TypeScript to use the non-polling version of the file watchers.
(<any>process.env)["TSC_NONPOLLING_WATCHER"] = true;

import * as ng from '@angular/language-service';

import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocument, Diagnostic, DiagnosticSeverity,
  InitializeParams, InitializeResult, TextDocumentPositionParams,
  CompletionItem, CompletionItemKind, Definition, Location, TextDocumentIdentifier,
  Position, Range, TextEdit, Hover
} from 'vscode-languageserver';

import {TextDocuments, TextDocumentEvent, fileNameToUri} from './documents';
import {ErrorCollector} from './errors';

import {Completion, Span} from '@angular/language-service';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection();

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments(handleTextEvent);


// Setup the error collector that watches for document events and requests errors
// reported back to the client
const errorCollector = new ErrorCollector(documents, connection);

function handleTextEvent(event: TextDocumentEvent) {
  switch (event.kind) {
    case 'context':
    case 'change':
    case 'opened':
      errorCollector.requestErrors(event.document);
  }
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
  workspaceRoot = params.rootPath;
  return {
    capabilities: {
      // Tell the client that the server works in FULL text document sync mode
      textDocumentSync: documents.syncKind,
      // Tell the client that the server support code complete
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['<', '.', '*', '[', '(']
      },
      definitionProvider: true,
      hoverProvider: true
    }
  }
});

function compiletionKindToCompletionItemKind(kind: string): CompletionItemKind {
  switch (kind) {
  case 'attribute': return CompletionItemKind.Property;
  case 'html attribute': return CompletionItemKind.Property;
  case 'component': return CompletionItemKind.Class;
  case 'element': return CompletionItemKind.Class;
  case 'entity': return CompletionItemKind.Text;
  case 'key': return CompletionItemKind.Class;
  case 'method': return CompletionItemKind.Method;
  case 'pipe': return CompletionItemKind.Function;
  case 'property': return CompletionItemKind.Property;
  case 'type': return CompletionItemKind.Interface;
  case 'reference': return CompletionItemKind.Variable;
  case 'variable': return CompletionItemKind.Variable;
  }
  return CompletionItemKind.Text;
}

const wordRe = /(\w|\(|\)|\[|\]|\*|\-|\_|\.)+/g;
const special = /\(|\)|\[|\]|\*|\-|\_|\./;

// Convert attribute names with non-\w chracters into a text edit.
function insertionToEdit(range: Range, insertText: string): TextEdit {
  if (insertText.match(special) && range) {
    return TextEdit.replace(range, insertText);
  }
}

function getReplaceRange(document: TextDocumentIdentifier, offset: number): Range {
  const line = documents.getDocumentLine(document, offset);
  if (line && line.text && line.start <= offset && line.start + line.text.length >= offset) {
    const lineOffset = offset - line.start - 1;

    // Find the word that contains the offset
    let found: number, len: number;
    line.text.replace(wordRe, <any>((word: string, _: string, wordOffset: number) => {
      if (wordOffset <= lineOffset && wordOffset + word.length >= lineOffset && word.match(special)) {
        found = wordOffset;
        len = word.length;
      }
    }));
    if (found != null) {
      return Range.create(Position.create(line.line - 1, found), Position.create(line.line - 1, found + len));
    }
  }
}

function insertTextOf(completion: Completion): string {
  switch (completion.kind) {
    case 'attribute':
    case 'html attribute':
      return `${completion.name}=`;
  }
  return completion.name;
}

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const {fileName, service, offset, languageId} = documents.getServiceInfo(textDocumentPosition.textDocument,
    textDocumentPosition.position)
  if (fileName && service && offset != null) {
    let result = service.getCompletionsAt(fileName, offset);
    if (result && languageId == 'html') {
      // The HTML elements are provided by the HTML service when the text type is 'html'.
      result = result.filter(completion => completion.kind != 'element');
    }
    if (result) {
      const replaceRange = getReplaceRange(textDocumentPosition.textDocument, offset);
      return result.map(completion => ({
        label: completion.name,
        kind: compiletionKindToCompletionItemKind(completion.kind),
        detail: completion.kind,
        sortText: completion.sort,
        textEdit: insertionToEdit(replaceRange, insertTextOf(completion)),
        insertText: insertTextOf(completion)
      }));
    }
  }
});

function ngDefintionToDefintion(definition: ng.Definition): Definition {
  const locations = definition.map(d => {
    const document = TextDocumentIdentifier.create(fileNameToUri(d.fileName));
    const positions = documents.offsetsToPositions(document, [d.span.start, d.span.end]);
    return {document, positions}
  }).filter(d => d.positions.length > 0).map(d => {
    const range = Range.create(d.positions[0], d.positions[1]);
    return Location.create(d.document.uri, range);
  });
  if (locations && locations.length) {
    return locations;
  }
}

function logErrors<T>(f: () => T): T {
  try {
    return f();
  } catch (e) {
    if (e.message && e.stack) connection.console.error(`SERVER ERROR: ${e.message}\n${e.stack}`);
    throw e;
  }
}

connection.onDefinition((textDocumentPosition: TextDocumentPositionParams): Definition => logErrors(() => {
  const {fileName, service, offset, languageId} = documents.getServiceInfo(textDocumentPosition.textDocument,
    textDocumentPosition.position)
  if (fileName && service && offset != null) {
    let result = service.getDefinitionAt(fileName, offset);
    if (result) {
      return ngDefintionToDefintion(result);
    }
  }
}));

function ngHoverToHover(hover: ng.Hover, document: TextDocumentIdentifier): Hover {
  if (hover) {
    const positions = documents.offsetsToPositions(document, [hover.span.start, hover.span.end]);
    if (positions) {
      const range = Range.create(positions[0], positions[1]);
      return {
        contents: {language: 'typescript', value: hover.text.map(t => t.text).join('')},
        range
      };
    }
  }
}

connection.onHover((textDocumentPosition: TextDocumentPositionParams): Hover => logErrors(() => {
  const {fileName, service, offset, languageId} = documents.getServiceInfo(textDocumentPosition.textDocument,
    textDocumentPosition.position)
  if (fileName && service && offset != null) {
    let result = service.getHoverAt(fileName, offset);
    if (result) {
      return ngHoverToHover(result, textDocumentPosition.textDocument);
    }
  }
}));

// Listen on the connection
connection.listen();
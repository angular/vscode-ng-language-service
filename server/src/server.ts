/* --------------------------------------------------------------------------------------------
 * Portions Copyright (c) Microsoft Corporation. All rights reserved.
 * Portions Copyright (c) Google Inc. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference path="../typings/promise.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />

import 'reflect-metadata';
import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocument, Diagnostic, DiagnosticSeverity,
  InitializeParams, InitializeResult, TextDocumentPositionParams,
  CompletionItem, CompletionItemKind, Definition, TextDocumentIdentifier,
  Position, Range, TextEdit
} from 'vscode-languageserver';

import {TextDocuments, TextDocumentEvent} from './documents';
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
      }
    }
  }
});

function compiletionKindToCompletionItemKind(kind: string): number {
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
      return `${completion.name}="{{}}"`
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

// Listen on the connection
connection.listen();
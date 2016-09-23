/* --------------------------------------------------------------------------------------------
 * Portions Copyright (c) Microsoft Corporation. All rights reserved.
 * Portions Copyright (c) Google Inc. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference path="../typings/promise.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind, TextDocumentIdentifier, Range
} from 'vscode-languageserver';

import {TextDocuments, TextDocumentEvent} from './documents';
import {ErrorCollector} from './errors';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

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
				triggerCharacters: ['<', '.']
			}
		}
	}
});

function compiletionKindToCompletionItemKind(kind: string): number {
	switch (kind) {
	case 'element': return CompletionItemKind.Class;
	case 'attribute': return CompletionItemKind.Field;
	case 'entity': return CompletionItemKind.Text;
	case 'member': return CompletionItemKind.Property;
	}
	return CompletionItemKind.Text;
}

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	const {fileName, service, offset} = documents.getServiceInfo(textDocumentPosition.textDocument,
		textDocumentPosition.position)
	if (service) {
		const result = service.getCompletionsAt(fileName, offset);
		if (result) {
			return result.map(completion => ({
				label: completion.name,
				kind: compiletionKindToCompletionItemKind(completion.kind),
				detail: completion.kind,
				sortText: completion.sort
			}));
		}
	}
});


// Listen on the connection
connection.listen();
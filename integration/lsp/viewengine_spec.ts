/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {MessageConnection} from 'vscode-jsonrpc';
import * as lsp from 'vscode-languageserver-protocol';

import {APP_COMPONENT, FOO_TEMPLATE} from '../test_constants';

import {createConnection, initializeServer, openTextDocument} from './test_utils';

describe('Angular language server', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; /* 10 seconds */

  let client: MessageConnection;

  beforeEach(async () => {
    client = createConnection({
      ivy: false,
    });
    client.listen();
    await initializeServer(client);
  });

  afterEach(() => {
    client.dispose();
  })

  it('should handle completion', async () => {
    openTextDocument(client, APP_COMPONENT);
    client.sendNotification(lsp.DidChangeTextDocumentNotification.type, {
      textDocument: {
        uri: `file://${APP_COMPONENT}`,
        version: 2,
      },
      contentChanges: [
        {
          range: {
            start: {line: 4, character: 29},
            end: {line: 4, character: 29},
          },
          text: '.',
        },
      ],
    });
    const response = await client.sendRequest(lsp.CompletionRequest.type, {
      textDocument: {
        uri: `file://${APP_COMPONENT}`,
      },
      position: {line: 4, character: 30},
    });
    expect(response).toContain({
      label: 'charAt',
      kind: 2,
      detail: 'method',
      sortText: 'charAt',
      textEdit: {
        range: {
          start: {line: 4, character: 30},
          end: {line: 4, character: 30},
        },
        newText: 'charAt()',
      },
      filterText: 'charAt()',
      // The 'data' field is only meaningful in Ivy mode.
      data: jasmine.anything(),
    });
  });

  it('should handle hover on external template', async () => {
    openTextDocument(client, FOO_TEMPLATE);
    const response = await client.sendRequest(lsp.HoverRequest.type, {
      textDocument: {
        uri: `file://${FOO_TEMPLATE}`,
      },
      position: {line: 0, character: 3},
    });
    expect(response).toEqual({
      contents: [
        {
          language: 'typescript',
          value: '(property) FooComponent.title: string',
        },
      ],
      range: {
        start: {line: 0, character: 2},
        end: {line: 0, character: 7},
      },
    });
  });

  it('should show existing diagnostics on external template', async () => {
    client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
      textDocument: {
        uri: `file://${FOO_TEMPLATE}`,
        languageId: 'html',
        version: 1,
        text: `{{ doesnotexist }}`,
      },
    });
    const diagnostics: lsp.Diagnostic[] = await new Promise(resolve => {
      client.onNotification(
          lsp.PublishDiagnosticsNotification.type, (params: lsp.PublishDiagnosticsParams) => {
            resolve(params.diagnostics);
          });
    });
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].message).toContain(`Identifier 'doesnotexist' is not defined.`);
  });
});

describe('initialization', () => {
  it('should be handled at startup', async () => {
    const client = createConnection({
      ivy: false,
    });
    client.listen();
    const response = await initializeServer(client);
    expect(response).toEqual(jasmine.objectContaining({
      capabilities: {
        textDocumentSync: 2,
        completionProvider: {
          resolveProvider: false,
          triggerCharacters: ['<', '.', '*', '[', '(', '$', '|'],
        },
        definitionProvider: true,
        typeDefinitionProvider: false,
        hoverProvider: true,
        referencesProvider: false,
        renameProvider: false,
        workspace: {
          workspaceFolders: {
            supported: true,
          },
        },
      },
    }));
    client.dispose();
  });
});

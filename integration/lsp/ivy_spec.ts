/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import {MessageConnection} from 'vscode-jsonrpc';
import * as lsp from 'vscode-languageserver-protocol';
import {URI} from 'vscode-uri';

import {ProjectLanguageService, ProjectLanguageServiceParams, SuggestStrictMode, SuggestStrictModeParams} from '../../common/notifications';
import {NgccProgress, NgccProgressToken, NgccProgressType} from '../../common/progress';
import {GetTcbRequest} from '../../common/requests';

import {APP_COMPONENT, createConnection, createTracer, FOO_COMPONENT, FOO_TEMPLATE, initializeServer, openTextDocument, TSCONFIG} from './test_utils';

describe('Angular Ivy language server', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; /* 10 seconds */

  let client: MessageConnection;

  beforeEach(async () => {
    client = createConnection({
      ivy: true,
    });
    // If debugging, set to
    // - lsp.Trace.Messages to inspect request/response/notification, or
    // - lsp.Trace.Verbose to inspect payload
    client.trace(lsp.Trace.Off, createTracer());
    client.listen();
    await initializeServer(client);
  });

  afterEach(() => {
    client.dispose();
  });

  it('should send ngcc progress after a project has finished loading', async () => {
    openTextDocument(client, APP_COMPONENT);
    const configFilePath = await onNgccProgress(client);
    expect(configFilePath.endsWith('integration/project/tsconfig.json')).toBeTrue();
  });

  it('should disable language service until ngcc has completed', async () => {
    openTextDocument(client, APP_COMPONENT);
    const languageServiceEnabled = await onLanguageServiceStateNotification(client);
    expect(languageServiceEnabled).toBeFalse();
  });

  it('should re-enable language service once ngcc has completed', async () => {
    openTextDocument(client, APP_COMPONENT);
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
  });

  it('should handle hover on inline template', async () => {
    openTextDocument(client, APP_COMPONENT);
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    const response = await client.sendRequest(lsp.HoverRequest.type, {
      textDocument: {
        uri: `file://${APP_COMPONENT}`,
      },
      position: {line: 4, character: 25},
    });
    expect(response?.contents).toContain({
      language: 'typescript',
      value: '(property) AppComponent.name: string',
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
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    const diagnostics = await getDiagnosticsForFile(client, FOO_TEMPLATE);
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].message)
        .toBe(`Property 'doesnotexist' does not exist on type 'FooComponent'.`);
  });

  it('does not break after opening `.d.ts` file from external template', async () => {
    client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
      textDocument: {
        uri: `file://${FOO_TEMPLATE}`,
        languageId: 'html',
        version: 1,
        text: `<div *ngIf="false"></div>`,
      },
    });
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    const response = await client.sendRequest(lsp.DefinitionRequest.type, {
      textDocument: {
        uri: `file://${FOO_TEMPLATE}`,
      },
      position: {line: 0, character: 7},
    }) as lsp.LocationLink[];
    // 2 results - the NgIf class and the ngIf input
    expect(Array.isArray(response)).toBe(true);
    const {targetUri} = response[0];
    expect(targetUri.endsWith('angular/common/common.d.ts')).toBeTrue();
    // Open the `.d.ts` file
    openTextDocument(client, URI.parse(targetUri).fsPath);
    // try a hover operation again on *ngIf
    const hoverResponse = await client.sendRequest(lsp.HoverRequest.type, {
      textDocument: {
        uri: `file://${FOO_TEMPLATE}`,
      },
      position: {line: 0, character: 7},
    });
    expect(hoverResponse?.contents).toContain({
      language: 'typescript',
      value: 'declare (property) NgIf<boolean>.ngIf: boolean',
    });
  });

  describe('renaming', () => {
    describe('from template files', () => {
      beforeEach(async () => {
        openTextDocument(client, FOO_TEMPLATE);
        const languageServiceEnabled = await waitForNgcc(client);
        expect(languageServiceEnabled).toBeTrue();
      });

      it('should handle prepare rename request for property read', async () => {
        const response = await client.sendRequest(lsp.PrepareRenameRequest.type, {
          textDocument: {
            uri: `file://${FOO_TEMPLATE}`,
          },
          position: {line: 0, character: 3},
        }) as {range: lsp.Range, placeholder: string};
        expect(response.range).toEqual({
          start: {line: 0, character: 2},
          end: {line: 0, character: 7},
        });
        expect(response.placeholder).toEqual('title');
      });

      const expectedRenameInComponent = {
        range: {
          start: {line: 6, character: 2},
          end: {line: 6, character: 7},
        },
        newText: 'subtitle',
      };
      const expectedRenameInTemplate = {
        range: {
          start: {line: 0, character: 2},
          end: {line: 0, character: 7},
        },
        newText: 'subtitle',
      };

      it('should handle rename request for property read', async () => {
        const response = await client.sendRequest(lsp.RenameRequest.type, {
          textDocument: {
            uri: `file://${FOO_TEMPLATE}`,
          },
          position: {line: 0, character: 3},
          newName: 'subtitle'
        });
        expect(response).not.toBeNull();
        expect(response?.changes?.[FOO_TEMPLATE].length).toBe(1);
        expect(response?.changes?.[FOO_TEMPLATE]).toContain(expectedRenameInTemplate);
        expect(response?.changes?.[FOO_COMPONENT].length).toBe(1);
        expect(response?.changes?.[FOO_COMPONENT]).toContain(expectedRenameInComponent);
      });
    });

    describe('from typescript files', () => {
      beforeEach(async () => {
        openTextDocument(client, APP_COMPONENT);
        const languageServiceEnabled = await waitForNgcc(client);
        expect(languageServiceEnabled).toBeTrue();
      });

      it('should not be enabled, see https://github.com/microsoft/vscode/issues/115354',
         async () => {
           const prepareRenameResponse = await client.sendRequest(lsp.PrepareRenameRequest.type, {
             textDocument: {
               uri: `file://${APP_COMPONENT}`,
             },
             position: {line: 4, character: 25},
           }) as {range: lsp.Range, placeholder: string};
           expect(prepareRenameResponse).toBeNull();
           const renameResponse = await client.sendRequest(lsp.RenameRequest.type, {
             textDocument: {
               uri: `file://${APP_COMPONENT}`,
             },
             position: {line: 4, character: 25},
             newName: 'surname'
           });
           expect(renameResponse).toBeNull();
         });

      xdescribe('Blocked by https://github.com/microsoft/vscode/issues/115354', () => {
        it('should handle prepare rename request for property read', async () => {
          const response = await client.sendRequest(lsp.PrepareRenameRequest.type, {
            textDocument: {
              uri: `file://${APP_COMPONENT}`,
            },
            position: {line: 4, character: 25},
          }) as {range: lsp.Range, placeholder: string};
          expect(response.range).toEqual({
            start: {line: 4, character: 25},
            end: {line: 4, character: 29},
          });
          expect(response.placeholder).toEqual('name');
        });

        describe('property rename', () => {
          const expectedRenameInComponent = {
            range: {
              start: {line: 7, character: 2},
              end: {line: 7, character: 6},
            },
            newText: 'surname',
          };
          const expectedRenameInTemplate = {
            range: {
              start: {line: 4, character: 25},
              end: {line: 4, character: 29},
            },
            newText: 'surname',
          };

          it('should handle rename request for property read in a template', async () => {
            const response = await client.sendRequest(lsp.RenameRequest.type, {
              textDocument: {
                uri: `file://${APP_COMPONENT}`,
              },
              position: {line: 4, character: 25},
              newName: 'surname'
            });
            expect(response).not.toBeNull();
            expect(response?.changes?.[APP_COMPONENT].length).toBe(2);
            expect(response?.changes?.[APP_COMPONENT]).toContain(expectedRenameInComponent);
            expect(response?.changes?.[APP_COMPONENT]).toContain(expectedRenameInTemplate);
          });

          it('should handle rename request for property in the component', async () => {
            const response = await client.sendRequest(lsp.RenameRequest.type, {
              textDocument: {
                uri: `file://${APP_COMPONENT}`,
              },
              position: {line: 7, character: 4},
              newName: 'surname'
            });
            expect(response).not.toBeNull();
            expect(response?.changes?.[APP_COMPONENT].length).toBe(2);
            expect(response?.changes?.[APP_COMPONENT]).toContain(expectedRenameInComponent);
            expect(response?.changes?.[APP_COMPONENT]).toContain(expectedRenameInTemplate);
          });
        });
      });
    });
  });

  describe('compiler options', () => {
    const originalConfig = fs.readFileSync(TSCONFIG, 'utf-8');

    afterEach(() => {
      // TODO(kyliau): Use an in-memory FS harness for the server
      fs.writeFileSync(TSCONFIG, originalConfig);
    });

    describe('strictTemplates: false', () => {
      beforeEach(async () => {
        const config = JSON.parse(originalConfig);
        config.angularCompilerOptions.strictTemplates = false;
        fs.writeFileSync(TSCONFIG, JSON.stringify(config, null, 2));

        openTextDocument(client, APP_COMPONENT);
        const languageServiceEnabled = await waitForNgcc(client);
        expect(languageServiceEnabled).toBeTrue();
      });

      it('should suggest strict mode', async () => {
        const configFilePath = await onSuggestStrictMode(client);
        expect(configFilePath.endsWith('integration/project/tsconfig.json')).toBeTrue();
      });

      it('should disable renaming when strict mode is disabled', async () => {
        await onSuggestStrictMode(client);

        const prepareRenameResponse = await client.sendRequest(lsp.PrepareRenameRequest.type, {
          textDocument: {
            uri: `file://${APP_COMPONENT}`,
          },
          position: {line: 4, character: 25},
        }) as {range: lsp.Range, placeholder: string};
        expect(prepareRenameResponse).toBeNull();

        const renameResponse = await client.sendRequest(lsp.RenameRequest.type, {
          textDocument: {
            uri: `file://${APP_COMPONENT}`,
          },
          position: {line: 4, character: 25},
          newName: 'surname'
        });
        expect(renameResponse).toBeNull();
      });
    });
  });

  describe('getTcb', () => {
    it('should handle getTcb request', async () => {
      openTextDocument(client, FOO_TEMPLATE);
      await waitForNgcc(client);
      const response = await client.sendRequest(GetTcbRequest, {
        textDocument: {
          uri: `file://${FOO_TEMPLATE}`,
        },
        position: {line: 0, character: 3},
      });
      expect(response).toBeDefined();
    });
  });
});

function onNgccProgress(client: MessageConnection): Promise<string> {
  return new Promise(resolve => {
    client.onProgress(NgccProgressType, NgccProgressToken, (params: NgccProgress) => {
      if (params.done) {
        resolve(params.configFilePath);
      }
    });
  });
}

function onSuggestStrictMode(client: MessageConnection): Promise<string> {
  return new Promise(resolve => {
    client.onNotification(SuggestStrictMode, (params: SuggestStrictModeParams) => {
      resolve(params.configFilePath);
    });
  });
}

function onLanguageServiceStateNotification(client: MessageConnection): Promise<boolean> {
  return new Promise(resolve => {
    client.onNotification(ProjectLanguageService, (params: ProjectLanguageServiceParams) => {
      resolve(params.languageServiceEnabled);
    });
  });
}

function getDiagnosticsForFile(
    client: MessageConnection, fileName: string): Promise<lsp.Diagnostic[]> {
  return new Promise(resolve => {
    client.onNotification(
        lsp.PublishDiagnosticsNotification.type, (params: lsp.PublishDiagnosticsParams) => {
          if (params.uri === `file://${fileName}`) {
            resolve(params.diagnostics);
          }
        });
  });
}

async function waitForNgcc(client: MessageConnection): Promise<boolean> {
  await onNgccProgress(client);
  return onLanguageServiceStateNotification(client);
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import {promisify} from 'util';
import {MessageConnection} from 'vscode-jsonrpc';
import * as lsp from 'vscode-languageserver-protocol';
import {URI} from 'vscode-uri';

import {ProjectLanguageService, ProjectLanguageServiceParams, SuggestStrictMode, SuggestStrictModeParams} from '../../common/notifications';
import {NgccProgress, NgccProgressToken, NgccProgressType} from '../../common/progress';
import {GetComponentsWithTemplateFile, GetTcbRequest, GetTemplateLocationForComponent, IsInAngularProject} from '../../common/requests';
import {APP_COMPONENT, APP_COMPONENT_URI, FOO_COMPONENT, FOO_COMPONENT_URI, FOO_TEMPLATE, FOO_TEMPLATE_URI, PROJECT_PATH, TSCONFIG} from '../test_constants';

import {convertPathToFileUrl, createConnection, createTracer, initializeServer, openTextDocument} from './test_utils';

const setTimeoutP = promisify(setTimeout);

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
        uri: APP_COMPONENT_URI,
      },
      position: {line: 4, character: 25},
    });
    expect(response?.contents).toContain({
      language: 'typescript',
      value: '(property) AppComponent.name: string',
    });
  });

  it('should show diagnostics for inline template on open', async () => {
    openTextDocument(client, APP_COMPONENT);
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    const diagnostics = await getDiagnosticsForFile(client, APP_COMPONENT);
    expect(diagnostics.length).toBe(0);
  });

  it('should show diagnostics for external template on open', async () => {
    client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
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
    expect(diagnostics[0].relatedInformation).toBeDefined();
    expect(diagnostics[0].relatedInformation!.length).toBe(1);
    expect(diagnostics[0].relatedInformation![0].message)
        .toBe(`Error occurs in the template of component FooComponent.`);
    expect(diagnostics[0].relatedInformation![0].location.uri).toBe(FOO_COMPONENT_URI);
  });

  it('should support request cancellation', async () => {
    openTextDocument(client, APP_COMPONENT);
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    // Send a request and immediately cancel it
    const promise = client.sendRequest(lsp.HoverRequest.type, {
      textDocument: {
        uri: FOO_COMPONENT_URI,
      },
      position: {line: 4, character: 25},
    });
    // Request above is tagged with ID = 1
    client.sendNotification('$/cancelRequest', {id: 1});
    await expectAsync(promise).toBeRejectedWith(jasmine.objectContaining({
      code: lsp.LSPErrorCodes.RequestCancelled,
    }));
  });

  it('does not break after opening `.d.ts` file from external template', async () => {
    client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
        languageId: 'html',
        version: 1,
        text: `<div *ngIf="false"></div>`,
      },
    });
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    const response = await client.sendRequest(lsp.DefinitionRequest.type, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
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
        uri: FOO_TEMPLATE_URI,
      },
      position: {line: 0, character: 7},
    });
    expect(hoverResponse?.contents).toContain({
      language: 'typescript',
      value: 'declare (property) NgIf<boolean>.ngIf: boolean',
    });
  });

  describe('signature help', () => {
    it('should show signature help for an empty call', async () => {
      client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
        textDocument: {
          uri: FOO_TEMPLATE_URI,
          languageId: 'html',
          version: 1,
          text: `{{ title.toString() }}`,
        },
      });
      const languageServiceEnabled = await waitForNgcc(client);
      expect(languageServiceEnabled).toBeTrue();
      const response = (await client.sendRequest(lsp.SignatureHelpRequest.type, {
        textDocument: {
          uri: FOO_TEMPLATE_URI,
        },
        position: {line: 0, character: 18},
      }))!;
      expect(response).not.toBeNull();
      expect(response.signatures.length).toEqual(1);
      expect(response.signatures[0].label).toEqual('(): string');
    });

    it('should show signature help with multiple arguments', async () => {
      client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
        textDocument: {
          uri: FOO_TEMPLATE_URI,
          languageId: 'html',
          version: 1,
          text: `{{ title.substr(0, ) }}`,
        },
      });
      const languageServiceEnabled = await waitForNgcc(client);
      expect(languageServiceEnabled).toBeTrue();
      const response = (await client.sendRequest(lsp.SignatureHelpRequest.type, {
        textDocument: {
          uri: FOO_TEMPLATE_URI,
        },
        position: {line: 0, character: 19},
      }))!;
      expect(response).not.toBeNull();
      expect(response.signatures.length).toEqual(1);
      expect(response.signatures[0].label)
          .toEqual('(from: number, length?: number | undefined): string');
      expect(response.signatures[0].parameters).not.toBeUndefined();
      expect(response.activeParameter).toBe(1);

      const label = response.signatures[0].label;
      const paramLabels = response.signatures[0].parameters!.map(param => {
        const [start, end] = param.label as [number, number];
        return label.substring(start, end);
      });
      expect(paramLabels).toEqual(['from: number', 'length?: number | undefined']);
    });
  });

  describe('project reload', () => {
    const dummy = `${PROJECT_PATH}/node_modules/__foo__`;

    afterEach(() => {
      fs.unlinkSync(dummy);
    });

    it('should retain typecheck files', async () => {
      openTextDocument(client, APP_COMPONENT);
      const languageServiceEnabled = await waitForNgcc(client);
      expect(languageServiceEnabled).toBeTrue();
      // Create a file in node_modules, this will trigger a project reload via
      // the directory watcher
      fs.writeFileSync(dummy, '');
      // Project reload happens after 250ms delay
      // https://github.com/microsoft/TypeScript/blob/3c32f6e154ead6749b76ec9c19cbfdd2acad97d6/src/server/editorServices.ts#L957
      await setTimeoutP(500);
      // The following operation would result in compiler crash if typecheck
      // files are not retained after project reload
      const diagnostics = await getDiagnosticsForFile(client, APP_COMPONENT);
      expect(diagnostics.length).toBe(0);
    });
  });

  describe('completions', () => {
    it('for events', async () => {
      openTextDocument(client, FOO_TEMPLATE, `<my-app ()></my-app>`);
      const languageServiceEnabled = await waitForNgcc(client);
      expect(languageServiceEnabled).toBeTrue();
      const response = await client.sendRequest(lsp.CompletionRequest.type, {
        textDocument: {
          uri: FOO_TEMPLATE_URI,
        },
        position: {line: 0, character: 9},
      }) as lsp.CompletionItem[];
      const outputCompletion = response.find(i => i.label === '(appOutput)')!;
      expect(outputCompletion.kind).toEqual(lsp.CompletionItemKind.Property);
      // // replace range includes the closing )
      expect((outputCompletion.textEdit as lsp.TextEdit).range)
          .toEqual({start: {line: 0, character: 8}, end: {line: 0, character: 10}});
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
            uri: FOO_TEMPLATE_URI,
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
            uri: FOO_TEMPLATE_URI,
          },
          position: {line: 0, character: 3},
          newName: 'subtitle'
        });
        expect(response).not.toBeNull();
        expect(response?.changes?.[FOO_TEMPLATE_URI].length).toBe(1);
        expect(response?.changes?.[FOO_TEMPLATE_URI]).toContain(expectedRenameInTemplate);
        expect(response?.changes?.[FOO_COMPONENT_URI].length).toBe(1);
        expect(response?.changes?.[FOO_COMPONENT_URI]).toContain(expectedRenameInComponent);
      });
    });

    describe('from typescript files', () => {
      beforeEach(async () => {
        openTextDocument(client, APP_COMPONENT);
        const languageServiceEnabled = await waitForNgcc(client);
        expect(languageServiceEnabled).toBeTrue();
      });

      it('should handle prepare rename request for inline template property read', async () => {
        const response = await client.sendRequest(lsp.PrepareRenameRequest.type, {
          textDocument: {
            uri: APP_COMPONENT_URI,
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
              uri: APP_COMPONENT_URI,
            },
            position: {line: 4, character: 25},
            newName: 'surname'
          });
          expect(response).not.toBeNull();
          expect(response?.changes?.[APP_COMPONENT_URI].length).toBe(2);
          expect(response?.changes?.[APP_COMPONENT_URI]).toContain(expectedRenameInComponent);
          expect(response?.changes?.[APP_COMPONENT_URI]).toContain(expectedRenameInTemplate);
        });

        it('should handle rename request for property in the component', async () => {
          const response = await client.sendRequest(lsp.RenameRequest.type, {
            textDocument: {
              uri: APP_COMPONENT_URI,
            },
            position: {line: 7, character: 4},
            newName: 'surname'
          });
          expect(response).not.toBeNull();
          expect(response?.changes?.[APP_COMPONENT_URI].length).toBe(2);
          expect(response?.changes?.[APP_COMPONENT_URI]).toContain(expectedRenameInComponent);
          expect(response?.changes?.[APP_COMPONENT_URI]).toContain(expectedRenameInTemplate);
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
            uri: FOO_COMPONENT_URI,
          },
          position: {line: 4, character: 25},
        }) as {range: lsp.Range, placeholder: string};
        expect(prepareRenameResponse).toBeNull();

        const renameResponse = await client.sendRequest(lsp.RenameRequest.type, {
          textDocument: {
            uri: FOO_COMPONENT_URI,
          },
          position: {line: 4, character: 25},
          newName: 'surname'
        });
        expect(renameResponse).toBeNull();
      });
    });
  });

  it('should handle getTcb request', async () => {
    openTextDocument(client, FOO_TEMPLATE);
    await waitForNgcc(client);
    const response = await client.sendRequest(GetTcbRequest, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
      },
      position: {line: 0, character: 3},
    });
    expect(response).toBeDefined();
  });

  it('should handle goToComponent request', async () => {
    openTextDocument(client, FOO_TEMPLATE);
    await waitForNgcc(client);
    const response = await client.sendRequest(GetComponentsWithTemplateFile, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
      }
    });
    expect(response).toBeDefined();
  });

  it('should handle GetTemplateLocationForComponent request', async () => {
    openTextDocument(client, FOO_TEMPLATE);
    await waitForNgcc(client);
    const response = await client.sendRequest(GetTemplateLocationForComponent, {
      textDocument: {
        uri: FOO_COMPONENT_URI,
      },
      position: {line: 6, character: 0},
    });
    expect(response).toBeDefined();
    expect(response.uri).toContain('foo.component.html');
  });

  it('should handle GetTemplateLocationForComponent request when not in component', async () => {
    openTextDocument(client, FOO_TEMPLATE);
    await waitForNgcc(client);
    const response = await client.sendRequest(GetTemplateLocationForComponent, {
      textDocument: {
        uri: FOO_COMPONENT_URI,
      },
      position: {line: 1, character: 0},
    });
    expect(response).toBeNull();
  });

  it('should provide a "go to component" codelens', async () => {
    openTextDocument(client, FOO_TEMPLATE);
    await waitForNgcc(client);
    const codeLensResponse = await client.sendRequest(lsp.CodeLensRequest.type, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
      }
    });
    expect(codeLensResponse).toBeDefined();
    const [codeLens] = codeLensResponse!;
    expect(codeLens.data.uri).toEqual(FOO_TEMPLATE_URI);

    const codeLensResolveResponse =
        await client.sendRequest(lsp.CodeLensResolveRequest.type, codeLensResponse![0]);
    expect(codeLensResolveResponse).toBeDefined();
    expect(codeLensResolveResponse?.command?.title).toEqual('Go to component');
  });

  it('detects an Angular project', async () => {
    openTextDocument(client, FOO_TEMPLATE);
    await waitForNgcc(client);
    const templateResponse = await client.sendRequest(IsInAngularProject, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
      }
    });
    expect(templateResponse).toBe(true);
    const componentResponse = await client.sendRequest(IsInAngularProject, {
      textDocument: {
        uri: FOO_COMPONENT_URI,
      }
    });
    expect(componentResponse).toBe(true);
  })
});

describe('auto-apply optional chaining', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; /* 10 seconds */

  let client: MessageConnection;
  beforeEach(async () => {
    client = createConnection({
      ivy: true,
      includeAutomaticOptionalChainCompletions: true,
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

  it('should work on nullable symbol', async () => {
    openTextDocument(client, FOO_COMPONENT, `
    import {Component} from '@angular/core';
    @Component({
      templateUrl: 'foo.component.html',
    })
    export class FooComponent {
      person?: undefined|{name: string};
    }
    `);
    openTextDocument(client, FOO_TEMPLATE, `{{ person.n }}`);
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    const response = await client.sendRequest(lsp.CompletionRequest.type, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
      },
      position: {line: 0, character: 11},
    }) as lsp.CompletionItem[];
    const completion = response.find(i => i.label === 'name')!;
    expect(completion.kind).toEqual(lsp.CompletionItemKind.Property);
    expect((completion.textEdit as lsp.TextEdit).newText).toEqual('?.name');
  });

  it('should work on NonNullable symbol', async () => {
    openTextDocument(client, FOO_TEMPLATE, `{{ title.substr }}`);
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
    const response = await client.sendRequest(lsp.CompletionRequest.type, {
      textDocument: {
        uri: FOO_TEMPLATE_URI,
      },
      position: {line: 0, character: 15},
    }) as lsp.CompletionItem[];
    const completion = response.find(i => i.label === 'substr')!;
    expect(completion.kind).toEqual(lsp.CompletionItemKind.Method);
    expect((completion.textEdit as lsp.TextEdit).newText).toEqual('substr');
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
          if (params.uri === convertPathToFileUrl(fileName)) {
            resolve(params.diagnostics);
          }
        });
  });
}

async function waitForNgcc(client: MessageConnection): Promise<boolean> {
  await onNgccProgress(client);
  return onLanguageServiceStateNotification(client);
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {MessageConnection} from 'vscode-jsonrpc';
import * as lsp from 'vscode-languageserver-protocol';

import {NgccComplete, ProjectLanguageService, ProjectLanguageServiceParams, RunNgcc, RunNgccParams} from '../../common/notifications';

import {APP_COMPONENT, createConnection, initializeServer, openTextDocument} from './test_utils';

describe('Angular Ivy language server', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; /* 10 seconds */

  let client: MessageConnection;

  beforeEach(() => {
    client = createConnection({
      ivy: true,
    });
    client.listen();
  });

  afterEach(() => {
    client.dispose();
  });

  it('should send ngcc notification after a project has finished loading', async () => {
    await initializeServer(client);
    openTextDocument(client, APP_COMPONENT);
    const configFilePath = await onRunNgccNotification(client);
    expect(configFilePath.endsWith('integration/project/tsconfig.json')).toBeTrue();
  });

  it('should disable language service until ngcc has completed', async () => {
    await initializeServer(client);
    openTextDocument(client, APP_COMPONENT);
    const languageServiceEnabled = await onLanguageServiceStateNotification(client);
    expect(languageServiceEnabled).toBeFalse();
  });

  it('should re-enable language service once ngcc has completed', async () => {
    await initializeServer(client);
    openTextDocument(client, APP_COMPONENT);
    const languageServiceEnabled = await waitForNgcc(client);
    expect(languageServiceEnabled).toBeTrue();
  });

  it('should handle hover on inline template', async () => {
    await initializeServer(client);
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
});

function onRunNgccNotification(client: MessageConnection): Promise<string> {
  return new Promise(resolve => {
    client.onNotification(RunNgcc, (params: RunNgccParams) => {
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

async function waitForNgcc(client: MessageConnection): Promise<boolean> {
  const configFilePath = await onRunNgccNotification(client);
  // We run ngcc before the test, so no need to do anything here.
  client.sendNotification(NgccComplete, {
    success: true,
    configFilePath,
  });
  return onLanguageServiceStateNotification(client);
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {MessageConnection} from 'vscode-jsonrpc';

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
    const configFilePath = await onRunNgccNotification(client);
    client.sendNotification('angular/ngccComplete', {
      success: true,
      configFilePath,
    });
    const languageServiceEnabled = await onLanguageServiceStateNotification(client);
    expect(languageServiceEnabled).toBeTrue();
  });
});

function onRunNgccNotification(client: MessageConnection): Promise<string> {
  return new Promise(resolve => {
    // TODO(kyliau): Figure out how to import the notification type from
    // common/out/notifications.d.ts. Currently we cannot do this because the
    // TS files and JS outputs are in different trees. As a result, node module
    // resolution works for the former but not the latter since their relative
    // import paths are different.
    client.onNotification('angular/runNgcc', (params: {configFilePath: string}) => {
      resolve(params.configFilePath);
    });
  });
}

function onLanguageServiceStateNotification(client: MessageConnection): Promise<boolean> {
  return new Promise(resolve => {
    client.onNotification(
        'angular/projectLanguageService', (params: {languageServiceEnabled: boolean}) => {
          resolve(params.languageServiceEnabled);
        });
  });
}

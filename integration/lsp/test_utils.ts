/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {fork} from 'child_process';
import * as fs from 'fs';
import {resolve} from 'path';
import {createMessageConnection, IPCMessageReader, IPCMessageWriter, MessageConnection} from 'vscode-jsonrpc/node';
import * as lsp from 'vscode-languageserver-protocol';

const SERVER_PATH = resolve(__dirname, '../../../dist/npm/server/index.js');
const PACKAGE_ROOT = resolve(__dirname, '../../..');
const PROJECT_PATH = `${PACKAGE_ROOT}/integration/project`;
export const APP_COMPONENT = `${PROJECT_PATH}/app/app.component.ts`;
export const FOO_TEMPLATE = `${PROJECT_PATH}/app/foo.component.html`;

export interface ServerOptions {
  ivy: boolean;
}

export function createConnection(serverOptions: ServerOptions): MessageConnection {
  const argv: string[] = [
    '--node-ipc',
    '--tsProbeLocations',
    PACKAGE_ROOT,
    '--ngProbeLocations',
    SERVER_PATH,
  ];
  if (serverOptions.ivy) {
    argv.push('--experimental-ivy');
  }
  const server = fork(SERVER_PATH, argv, {
    cwd: PROJECT_PATH,
    env: {
      TSC_NONPOLLING_WATCHER: 'true',
    },
    // uncomment to debug server process
    // execArgv: ['--inspect-brk=9229']
  });

  const connection = createMessageConnection(
      new IPCMessageReader(server),
      new IPCMessageWriter(server),
  );
  connection.onDispose(() => {
    server.kill();
  });
  return connection;
}

export function initializeServer(client: MessageConnection): Promise<lsp.InitializeResult> {
  return client.sendRequest(lsp.InitializeRequest.type, {
    /**
     * The process id of the parent process that started the server. It is
     * always the current process.
     */
    processId: process.pid,
    rootUri: `file://${PROJECT_PATH}`,
    capabilities: {},
    /**
     * Options are 'off' | 'messages' | 'verbose'.
     * To debug test failure, set to 'verbose'.
     */
    trace: 'off',
    workspaceFolders: null,
  });
}

export function openTextDocument(client: MessageConnection, filePath: string) {
  client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
    textDocument: {
      uri: `file://${filePath}`,
      languageId: 'typescript',
      version: 1,
      text: fs.readFileSync(filePath, 'utf-8'),
    },
  });
}

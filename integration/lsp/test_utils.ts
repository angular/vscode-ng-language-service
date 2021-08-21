/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {fork} from 'child_process';
import * as fs from 'fs';
import {createMessageConnection, IPCMessageReader, IPCMessageWriter, MessageConnection} from 'vscode-jsonrpc/node';
import * as lsp from 'vscode-languageserver-protocol';

import {PROJECT_PATH, SERVER_PATH} from '../test_constants';

export interface ServerOptions {
  ivy: boolean;
  includeAutomaticOptionalChainCompletions?: boolean;
}

export function createConnection(serverOptions: ServerOptions): MessageConnection {
  const argv: string[] = [
    '--node-ipc',
    '--tsProbeLocations',
    SERVER_PATH,
    '--ngProbeLocations',
    [SERVER_PATH, PROJECT_PATH].join(','),
  ];
  if (!serverOptions.ivy) {
    argv.push('--viewEngine');
  }
  if (serverOptions.includeAutomaticOptionalChainCompletions) {
    argv.push('--includeAutomaticOptionalChainCompletions');
  }
  const server = fork(SERVER_PATH, argv, {
    cwd: PROJECT_PATH,
    // uncomment to debug server process
    // execArgv: ['--inspect-brk=9330']
  });
  server.on('close', (code: number) => {
    if (code !== null && code !== 0) {
      throw new Error(`Server exited with code: ${code}`);
    }
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

export function openTextDocument(client: MessageConnection, filePath: string, newText?: string) {
  let languageId = 'unknown';
  if (filePath.endsWith('ts')) {
    languageId = 'typescript';
  } else if (filePath.endsWith('html')) {
    languageId = 'html';
  }
  client.sendNotification(lsp.DidOpenTextDocumentNotification.type, {
    textDocument: {
      uri: `file://${filePath}`,
      languageId,
      version: 1,
      text: newText ?? fs.readFileSync(filePath, 'utf-8'),
    },
  });
}

export function createTracer(): lsp.Tracer {
  return {
    log(messageOrDataObject: string|any, data?: string) {
      if (typeof messageOrDataObject === 'string') {
        const message = messageOrDataObject;
        console.log(`[Trace - ${(new Date().toLocaleTimeString())}] ${message}`);
        if (data) {
          console.log(data);
        }
      } else {
        const dataObject = messageOrDataObject;
        console.log(
            `[Trace - ${(new Date().toLocaleTimeString())}] ` +
            JSON.stringify(dataObject, null, 2));
      }
    },
  };
}

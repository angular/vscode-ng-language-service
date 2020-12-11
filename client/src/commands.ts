/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as vscode from 'vscode';
import {ServerOptions} from '../common/initialize';
import {AngularLanguageClient} from './client';

/**
 * Represent a vscode command with an ID and an impl function `execute`.
 */
interface Command {
  id: string;
  execute(): Promise<unknown>;
}

/**
 * Restart the language server by killing the process then spanwing a new one.
 * @param client language client
 * @param context extension context for adding disposables
 */
function restartNgServer(client: AngularLanguageClient): Command {
  return {
    id: 'angular.restartNgServer',
    async execute() {
      await client.stop();
      await client.start();
    },
  };
}

/**
 * Open the current server log file in a new editor.
 */
function openLogFile(client: AngularLanguageClient): Command {
  return {
    id: 'angular.openLogFile',
    async execute() {
      const serverOptions: ServerOptions|undefined = client.initializeResult?.serverOptions;
      if (!serverOptions?.logFile) {
        // Show a MessageItem to help users automatically update the
        // configuration option then restart the server.
        const selection = await vscode.window.showErrorMessage(
            `Angular server logging is off. Please set 'angular.log' and restart the server.`,
            'Enable logging and restart server',
        );
        if (selection) {
          const isGlobalConfig = false;
          await vscode.workspace.getConfiguration().update(
              'angular.log', 'verbose', isGlobalConfig);
          // Restart the server
          await client.stop();
          await client.start();
        }
        return;
      }
      const document = await vscode.workspace.openTextDocument(serverOptions.logFile);
      return vscode.window.showTextDocument(document);
    },
  };
}

/**
 * Register all supported vscode commands for the Angular extension.
 * @param client language client
 * @param context extension context for adding disposables
 */
export function registerCommands(
    client: AngularLanguageClient, context: vscode.ExtensionContext): void {
  const commands: Command[] = [
    restartNgServer(client),
    openLogFile(client),
  ];

  for (const command of commands) {
    const disposable = vscode.commands.registerCommand(command.id, command.execute);
    context.subscriptions.push(disposable);
  }
}

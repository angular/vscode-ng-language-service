/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';
import {ServerOptions} from '../common/initialize';

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
function restartNgServer(client: lsp.LanguageClient, context: vscode.ExtensionContext): Command {
  return {
    id: 'angular.restartNgServer',
    async execute() {
      await client.stop();
      context.subscriptions.push(client.start());
    },
  };
}

/**
 * Open the current server log file in a new editor.
 */
function openLogFile(client: lsp.LanguageClient): Command {
  return {
    id: 'angular.openLogFile',
    async execute() {
      const serverOptions: ServerOptions|undefined = client.initializeResult?.serverOptions;
      if (!serverOptions?.logFile) {
        // TODO: We could show a MessageItem to help users automatically update
        // the configuration option then restart the server, but we currently do
        // not reload the server options when restarting the server.
        vscode.window.showErrorMessage(
            `Angular Server logging is off. Please set 'angular.log' and reload the window.`);
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
    client: lsp.LanguageClient, context: vscode.ExtensionContext): void {
  const commands: Command[] = [
    restartNgServer(client, context),
    openLogFile(client),
  ];

  for (const command of commands) {
    const disposable = vscode.commands.registerCommand(command.id, command.execute);
    context.subscriptions.push(disposable);
  }
}

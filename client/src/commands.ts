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
import {ANGULAR_SCHEME, TcbContentProvider} from './providers';

/**
 * Represent a vscode command with an ID and an impl function `execute`.
 */
type Command = {
  id: string,
  isTextEditorCommand: false,
  execute(): Promise<unknown>,
}|{
  id: string,
  isTextEditorCommand: true,
  execute(textEditor: vscode.TextEditor): Promise<unknown>,
};

/**
 * Restart the language server by killing the process then spanwing a new one.
 * @param client language client
 * @param context extension context for adding disposables
 */
function restartNgServer(client: AngularLanguageClient): Command {
  return {
    id: 'angular.restartNgServer',
    isTextEditorCommand: false,
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
    isTextEditorCommand: false,
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
          // Server will automatically restart because the config is changed
        }
        return;
      }
      const document = await vscode.workspace.openTextDocument(serverOptions.logFile);
      return vscode.window.showTextDocument(document);
    },
  };
}

/**
 * Command getTemplateTcb displays a typecheck block for the template a user has
 * an active selection over, if any.
 * @param ngClient LSP client for the active session
 * @param context extension context to which disposables are pushed
 */
function getTemplateTcb(
    ngClient: AngularLanguageClient, context: vscode.ExtensionContext): Command {
  const TCB_HIGHLIGHT_DECORATION = vscode.window.createTextEditorDecorationType({
    // See https://code.visualstudio.com/api/references/theme-color#editor-colors
    backgroundColor: new vscode.ThemeColor('editor.selectionHighlightBackground'),
  });

  const tcbProvider = new TcbContentProvider();
  const disposable = vscode.workspace.registerTextDocumentContentProvider(
      ANGULAR_SCHEME,
      tcbProvider,
  );
  context.subscriptions.push(disposable);

  return {
    id: 'angular.getTemplateTcb',
    isTextEditorCommand: true,
    async execute(textEditor: vscode.TextEditor) {
      tcbProvider.clear();
      const response = await ngClient.getTcbUnderCursor(textEditor);
      if (response === undefined) {
        return undefined;
      }
      // Change the scheme of the URI from `file` to `ng` so that the document
      // content is requested from our own `TcbContentProvider`.
      const tcbUri = response.uri.with({
        scheme: ANGULAR_SCHEME,
      });
      tcbProvider.update(tcbUri, response.content);
      const editor = await vscode.window.showTextDocument(tcbUri, {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,  // cursor remains in the active editor
      });
      editor.setDecorations(TCB_HIGHLIGHT_DECORATION, response.selections);
    }
  };
}

/**
 * Command goToComponentWithTemplateFile finds components which reference an external template in
 * their `templateUrl`s.
 *
 * @param ngClient LSP client for the active session
 */
function goToComponentWithTemplateFile(ngClient: AngularLanguageClient): Command {
  return {
    id: 'angular.goToComponentWithTemplateFile',
    isTextEditorCommand: true,
    async execute(textEditor: vscode.TextEditor) {
      const locations = await ngClient.getComponentsForOpenExternalTemplate(textEditor);
      if (locations === undefined) {
        return;
      }

      vscode.commands.executeCommand(
          'editor.action.goToLocations',
          textEditor.document.uri,
          textEditor.selection.active,
          locations,
          'peek', /** what to do when there are multiple results */
      );
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
    getTemplateTcb(client, context),
    goToComponentWithTemplateFile(client),
  ];

  for (const command of commands) {
    const disposable = command.isTextEditorCommand ?
        vscode.commands.registerTextEditorCommand(command.id, command.execute) :
        vscode.commands.registerCommand(command.id, command.execute);
    context.subscriptions.push(disposable);
  }
}

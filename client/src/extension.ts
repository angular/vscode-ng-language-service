/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as path from 'path';
import {ExtensionContext, ProgressLocation, window, workspace} from 'vscode';
import {LanguageClient, LanguageClientOptions, RevealOutputChannelOn, ServerOptions, TransportKind} from 'vscode-languageclient';

import {projectLoadingNotification} from './protocol';

export function activate(context: ExtensionContext) {
  // Log file does not yet exist on disk. It is up to the server to create the
  // file.
  const logFile = path.join(context.logPath, 'nglangsvc.log');

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: context.asAbsolutePath(path.join('server', 'server.js')),
      transport: TransportKind.ipc,
      args: [
        '--logFile', logFile,
        // TODO: Might want to turn off logging completely.
      ],
      options: {
        env: {
          // Force TypeScript to use the non-polling version of the file watchers.
          TSC_NONPOLLING_WATCHER: true,
        },
      },
    },
    debug: {
      module: context.asAbsolutePath(path.join('server', 'out', 'server.js')),
      transport: TransportKind.ipc,
      args: [
        '--logFile',
        logFile,
        '--logVerbosity',
        'verbose',
      ],
      options: {
        env: {
          // Force TypeScript to use the non-polling version of the file watchers.
          TSC_NONPOLLING_WATCHER: true,
          NG_DEBUG: true,
        },
        execArgv: [
          // do not lazily evaluate the code so all breakpoints are respected
          '--nolazy',
          // If debugging port is changed, update .vscode/launch.json as well
          '--inspect=6009',
        ]
      },
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Angular templates and TypeScript documents
    documentSelector: [
      // scheme: 'file' means listen to changes to files on disk only
      // other option is 'untitled', for buffer in the editor (like a new doc)
      {scheme: 'file', language: 'html'},
      {scheme: 'file', language: 'typescript'},
    ],

    synchronize: {
      fileEvents: [
        // Notify the server about file changes to tsconfig.json contained in the workspace
        workspace.createFileSystemWatcher('**/tsconfig.json'),
      ]
    },

    // Don't let our output console pop open
    revealOutputChannelOn: RevealOutputChannelOn.Never
  };

  // Create the language client and start the client.
  const forceDebug = !!process.env['NG_DEBUG'];
  const client =
      new LanguageClient('Angular Language Service', serverOptions, clientOptions, forceDebug);
  const disposable = client.start();

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);

  client.onReady().then(() => {
    const projectLoadingTasks = new Map<string, {resolve: () => void}>();

    client.onNotification(projectLoadingNotification.start, (projectName: string) => {
      window.withProgress(
          {
            location: ProgressLocation.Window,
            title: 'Initializing Angular language features',
          },
          () => new Promise((resolve) => {
            projectLoadingTasks.set(projectName, {resolve});
          }));
    });

    client.onNotification(projectLoadingNotification.finish, (projectName: string) => {
      const task = projectLoadingTasks.get(projectName);
      if (task) {
        task.resolve();
        projectLoadingTasks.delete(projectName);
      }
    });
  });
}

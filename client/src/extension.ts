/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';

import * as notification from '../../common/out/notifications';

import {resolveAndRunNgcc} from './command-ngcc';
import {registerCommands} from './commands';
import {withProgress} from './progress-reporter';

export function activate(context: vscode.ExtensionContext) {
  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: lsp.ServerOptions = {
    run: getServerOptions(context, false /* debug */),
    debug: getServerOptions(context, true /* debug */),
  };

  // Options to control the language client
  const clientOptions: lsp.LanguageClientOptions = {
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
        vscode.workspace.createFileSystemWatcher('**/tsconfig.json'),
      ]
    },

    // Don't let our output console pop open
    revealOutputChannelOn: lsp.RevealOutputChannelOn.Never
  };

  // Create the language client and start the client.
  const forceDebug = process.env['NG_DEBUG'] === 'true';
  const client =
      new lsp.LanguageClient('Angular Language Service', serverOptions, clientOptions, forceDebug);

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(...registerCommands(client), client.start());

  client.onDidChangeState((e: lsp.StateChangeEvent) => {
    if (e.newState === lsp.State.Running) {
      registerNotificationHandlers(client);
    }
  });
}

function registerNotificationHandlers(client: lsp.LanguageClient) {
  client.onNotification(notification.ProjectLoadingStart, () => {
    vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: 'Initializing Angular language features',
        },
        () => new Promise<void>((resolve) => {
          client.onNotification(notification.ProjectLoadingFinish, resolve);
        }),
    );
  });

  client.onNotification(notification.RunNgcc, async (params: notification.RunNgccParams) => {
    const {configFilePath} = params;
    try {
      await withProgress(
          {
            location: vscode.ProgressLocation.Window,
            title: `Running ngcc for project ${configFilePath}`,
            cancellable: false,
          },
          (progress: vscode.Progress<string>) => {
            return resolveAndRunNgcc(configFilePath, progress);
          },
      );
      client.sendNotification(notification.NgccComplete, {
        configFilePath,
        success: true,
      });
    } catch (e) {
      vscode.window.showWarningMessage(
          `Failed to run ngcc. Ivy language service might not function correctly. Please see the log file for more information.`);
      client.sendNotification(notification.NgccComplete, {
        configFilePath,
        success: false,
        error: e.message,
      });
    }
  });
}

/**
 * Return the paths for the module that corresponds to the specified `configValue`,
 * and use the specified `bundled` as fallback if none is provided.
 * @param configName
 * @param bundled
 */
function getProbeLocations(configValue: string|null, bundled: string): string[] {
  const locations = [];
  // Always use config value if it's specified
  if (configValue) {
    locations.push(configValue);
  }
  // Prioritize the bundled version
  locations.push(bundled);
  // Look in workspaces currently open
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  for (const folder of workspaceFolders) {
    locations.push(folder.uri.fsPath);
  }
  return locations;
}

/**
 * Construct the arguments that's used to spawn the server process.
 * @param ctx vscode extension context
 * @param debug true if debug mode is on
 */
function constructArgs(ctx: vscode.ExtensionContext, debug: boolean): string[] {
  const config = vscode.workspace.getConfiguration();
  const args: string[] = [];

  const ngLog: string = config.get('angular.log', 'off');
  if (ngLog !== 'off') {
    // Log file does not yet exist on disk. It is up to the server to create the file.
    const logFile = path.join(ctx.logPath, 'nglangsvc.log');
    args.push('--logFile', logFile);
    args.push('--logVerbosity', debug ? 'verbose' : ngLog);
  }

  const ngdk: string|null = config.get('angular.ngdk', null);
  const ngProbeLocations = getProbeLocations(ngdk, ctx.asAbsolutePath('server'));
  args.push('--ngProbeLocations', ngProbeLocations.join(','));

  const experimentalIvy: boolean = config.get('angular.experimental-ivy', false);
  if (experimentalIvy) {
    args.push('--experimental-ivy');
  }

  const tsdk: string|null = config.get('typescript.tsdk', null);
  const tsProbeLocations = getProbeLocations(tsdk, ctx.extensionPath);
  args.push('--tsProbeLocations', tsProbeLocations.join(','));

  return args;
}

function getServerOptions(ctx: vscode.ExtensionContext, debug: boolean): lsp.NodeModule {
  // Environment variables for server process
  const prodEnv = {
    // Force TypeScript to use the non-polling version of the file watchers.
    TSC_NONPOLLING_WATCHER: true,
  };
  const devEnv = {
    ...prodEnv,
    NG_DEBUG: true,
  };

  // Node module for the language server
  const prodBundle = ctx.asAbsolutePath('server');
  const devBundle = ctx.asAbsolutePath(path.join('server', 'out', 'server.js'));

  // Argv options for Node.js
  const prodExecArgv: string[] = [];
  const devExecArgv: string[] = [
    // do not lazily evaluate the code so all breakpoints are respected
    '--nolazy',
    // If debugging port is changed, update .vscode/launch.json as well
    '--inspect=6009',
  ];

  return {
    // VS Code Insider launches extensions in debug mode by default but users
    // install prod bundle so we have to check whether dev bundle exists.
    module: debug && fs.existsSync(devBundle) ? devBundle : prodBundle,
    transport: lsp.TransportKind.ipc,
    args: constructArgs(ctx, debug),
    options: {
      env: debug ? devEnv : prodEnv,
      execArgv: debug ? devExecArgv : prodExecArgv,
    },
  };
}

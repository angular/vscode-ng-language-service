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
import * as lsp from 'vscode-languageclient/node';

import {ProjectLoadingFinish, ProjectLoadingStart, SuggestStrictMode, SuggestStrictModeParams} from '../common/notifications';
import {NgccProgress, NgccProgressToken, NgccProgressType} from '../common/progress';

import {ProgressReporter} from './progress-reporter';

export class AngularLanguageClient implements vscode.Disposable {
  private client: lsp.LanguageClient|null = null;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly outputChannel: vscode.OutputChannel;
  private readonly clientOptions: lsp.LanguageClientOptions;
  private readonly name = 'Angular Language Service';

  constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel(this.name);
    // Options to control the language client
    this.clientOptions = {
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
      revealOutputChannelOn: lsp.RevealOutputChannelOn.Never,
      outputChannel: this.outputChannel,
    };
  }

  /**
   * Spin up the language server in a separate process and establish a connection.
   */
  async start(): Promise<void> {
    if (this.client !== null) {
      throw new Error(`An existing client is running. Call stop() first.`);
    }

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: lsp.ServerOptions = {
      run: getServerOptions(this.context, false /* debug */),
      debug: getServerOptions(this.context, true /* debug */),
    };

    // Create the language client and start the client.
    const forceDebug = process.env['NG_DEBUG'] === 'true';
    this.client = new lsp.LanguageClient(
        // This is the ID for Angular-specific configurations, like angular.log,
        // angular.ngdk, etc. See contributes.configuration in package.json.
        'angular',
        this.name,
        serverOptions,
        this.clientOptions,
        forceDebug,
    );
    this.disposables.push(this.client.start());
    await this.client.onReady();
    // Must wait for the client to be ready before registering notification
    // handlers.
    registerNotificationHandlers(this.client, this.context);
    registerProgressHandlers(this.client, this.context);
  }

  /**
   * Kill the language client and perform some clean ups.
   */
  async stop(): Promise<void> {
    if (this.client === null) {
      return;
    }
    await this.client.stop();
    this.outputChannel.clear();
    this.dispose();
    this.client = null;
  }

  get initializeResult(): lsp.InitializeResult|undefined {
    return this.client?.initializeResult;
  }

  dispose() {
    for (let d = this.disposables.pop(); d !== undefined; d = this.disposables.pop()) {
      d.dispose();
    }
  }
}

function registerNotificationHandlers(
    client: lsp.LanguageClient, context: vscode.ExtensionContext) {
  const disposable1 = client.onNotification(ProjectLoadingStart, () => {
    vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: 'Initializing Angular language features',
        },
        () => new Promise<void>((resolve) => {
          client.onNotification(ProjectLoadingFinish, resolve);
        }),
    );
  });

  const disposable2 =
      client.onNotification(SuggestStrictMode, async (params: SuggestStrictModeParams) => {
        const openTsConfig = 'Open tsconfig.json';
        // Markdown is not generally supported in `showInformationMessage()`,
        // but links are supported. See
        // https://github.com/microsoft/vscode/issues/20595#issuecomment-281099832
        const selection = await vscode.window.showInformationMessage(
            'Some language features are not available. To access all features, enable ' +
                '[strictTemplates](https://angular.io/guide/angular-compiler-options#stricttemplates) in ' +
                '[angularCompilerOptions](https://angular.io/guide/angular-compiler-options).',
            openTsConfig,
        );
        if (selection === openTsConfig) {
          const document = await vscode.workspace.openTextDocument(params.configFilePath);
          vscode.window.showTextDocument(document);
        }
      });

  context.subscriptions.push(disposable1, disposable2);
}

function registerProgressHandlers(client: lsp.LanguageClient, context: vscode.ExtensionContext) {
  const progressReporters = new Map<string, ProgressReporter>();
  const disposable =
      client.onProgress(NgccProgressType, NgccProgressToken, async (params: NgccProgress) => {
        const {configFilePath} = params;
        if (!progressReporters.has(configFilePath)) {
          progressReporters.set(configFilePath, new ProgressReporter());
        }
        const reporter = progressReporters.get(configFilePath)!;
        if (params.done) {
          reporter.finish();
          progressReporters.delete(configFilePath);
          if (!params.success) {
            const selection = await vscode.window.showErrorMessage(
                `Angular extension might not work correctly because ngcc operation failed. ` +
                    `Try to invoke ngcc manually by running 'npm/yarn run ngcc'. ` +
                    `Please see the extension output for more information.`,
                'Show output',
            );
            if (selection) {
              client.outputChannel.show();
            }
          }
        } else {
          reporter.report(params.message);
        }
      });
  // Dispose the progress handler on exit
  context.subscriptions.push(disposable);
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
  const args: string[] = ['--logToConsole'];

  const ngLog: string = config.get('angular.log', 'off');
  if (ngLog !== 'off') {
    // Log file does not yet exist on disk. It is up to the server to create the file.
    const logFile = path.join(ctx.logPath, 'nglangsvc.log');
    args.push('--logFile', logFile);
    args.push('--logVerbosity', debug ? 'verbose' : ngLog);
  }

  const ngdk: string|null = config.get('angular.ngdk', null);
  const ngProbeLocations = getProbeLocations(ngdk, ctx.extensionPath);
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
  const devBundle = ctx.asAbsolutePath(path.join('dist', 'server', 'server.js'));

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

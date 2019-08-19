import * as path from 'path';

import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, RevealOutputChannelOn } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run : {
      module: context.asAbsolutePath(path.join('server', 'server.js')),
      transport: TransportKind.ipc,
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
      options: {
        env: {
          // Force TypeScript to use the non-polling version of the file watchers.
          TSC_NONPOLLING_WATCHER: true,
          NG_DEBUG: true,
        },
        execArgv: [
          "--inspect=6009",	// If this is changed, update .vscode/launch.json as well
        ]
      },
    },
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Angular templates
    documentSelector: ['ng-template', 'html', 'typescript'],

    // Information in the TypeScript project is necessary to generate Angular template completions
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher('**/tsconfig.json'),
        workspace.createFileSystemWatcher('**/*.ts')
      ]
    },

    // Don't let our output console pop open
    revealOutputChannelOn: RevealOutputChannelOn.Never
  }

  // Create the language client and start the client.
  const disposable = new LanguageClient('Angular Language Service', serverOptions, clientOptions).start();

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);
}

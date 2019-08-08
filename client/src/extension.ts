import * as path from 'path';

import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, RevealOutputChannelOn } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
  const options = {
    module: serverModule,
    transport: TransportKind.ipc,
    options: {
      env: {
        // Force TypeScript to use the non-polling version of the file watchers.
        TSC_NONPOLLING_WATCHER: true,
      },
    },
  };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run : options,
    debug: options,
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
  const disposable = new LanguageClient('Angular Language Service', serverOptions, clientOptions, true).start();

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);
}

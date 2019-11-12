/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {createLogger} from './logger';
import {ServerHost} from './server_host';
import {Session} from './session';
import {resolveWithMinMajor} from './version_provider';

// Parse command line arguments
const help = hasArgument('--help');
const logFile = findArgument('--logFile');
const logVerbosity = findArgument('--logVerbosity');
const ngProbeLocations = parseStringArray('--ngProbeLocations');
const tsProbeLocations = parseStringArray('--tsProbeLocations');

if (help) {
  const {argv} = process;
  console.error(`Angular Language Service that implements the Language Server Protocol (LSP).

Usage: ${argv[0]} ${argv[1]} [options]

Options:
  --help: Prints help message.
  --logFile: Location to log messages. Logging is disabled if not provided.
  --logVerbosity: terse|normal|verbose|requestTime. See ts.server.LogLevel.
  --ngProbeLocations: Path of @angular/language-service. Required.
  --tsProbeLocations: Path of typescript. Required.

Additional options supported by vscode-languageserver:
  --clientProcessId=<number>: Automatically kills the server if the client process dies.
  --node-ipc: Communicate using Node's IPC. This is the default.
  --stdio: Communicate over stdin/stdout.
  --socket=<number>: Communicate using Unix socket.
`);
  process.exit(0);
}

// Create a logger that logs to file. OK to emit verbose entries.
const logger = createLogger({logFile, logVerbosity});

const ts = resolveWithMinMajor('typescript', 3, tsProbeLocations);
const ng = resolveWithMinMajor('@angular/language-service', 9, ngProbeLocations);

// ServerHost provides native OS functionality
const host = new ServerHost();

// Establish a new server session that encapsulates lsp connection.
const session = new Session({
  host,
  logger,
  ngProbeLocation: ng.resolvedPath,
});

// Log initialization info
session.info(`Angular language server process ID: ${process.pid}`);
session.info(`Using typescript v${ts.version} from ${ts.resolvedPath}`);
session.info(`Using @angular/language-service v${ng.version} from ${ng.resolvedPath}`);
session.info(`Log file: ${logger.getLogFileName()}`);
if (process.env.NG_DEBUG) {
  session.info('Angular Language Service is running under DEBUG mode');
}
if (process.env.TSC_NONPOLLING_WATCHER !== 'true') {
  session.warn(`Using less efficient polling watcher. Set TSC_NONPOLLING_WATCHER to true.`);
}

session.listen();

function hasArgument(argName: string): boolean {
  return process.argv.includes(argName);
}

function findArgument(argName: string): string|undefined {
  const index = process.argv.indexOf(argName);
  if (index < 0 || index === process.argv.length - 1) {
    return;
  }
  return process.argv[index + 1];
}

function parseStringArray(argName: string): string[] {
  const arg = findArgument(argName);
  if (!arg) {
    return [];
  }
  return arg.split(',');
}

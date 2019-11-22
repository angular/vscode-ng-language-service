/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

function findArgument(argv: string[], argName: string): string|undefined {
  const index = argv.indexOf(argName);
  if (index < 0 || index === argv.length - 1) {
    return;
  }
  return argv[index + 1];
}

function parseStringArray(argv: string[], argName: string): string[] {
  const arg = findArgument(argv, argName);
  if (!arg) {
    return [];
  }
  return arg.split(',');
}

function hasArgument(argv: string[], argName: string): boolean {
  return argv.includes(argName);
}

interface CommandLineOptions {
  help: boolean;
  logFile?: string;
  logVerbosity?: string;
  ngProbeLocations: string[];
  tsProbeLocations: string[];
}

export function parseCommandLine(argv: string[]): CommandLineOptions {
  return {
    help: hasArgument(argv, '--help'),
    logFile: findArgument(argv, '--logFile'),
    logVerbosity: findArgument(argv, '--logVerbosity'),
    ngProbeLocations: parseStringArray(argv, '--ngProbeLocations'),
    tsProbeLocations: parseStringArray(argv, '--tsProbeLocations'),
  };
}

export function generateHelpMessage(argv: string[]) {
  return `Angular Language Service that implements the Language Server Protocol (LSP).

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
  `;
}

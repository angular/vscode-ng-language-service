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
  /**
   * If true, use Ivy LS, otherwise use legacy View Engine LS.
   */
  ivy: boolean;
  logFile?: string;
  logVerbosity?: string;
  logToConsole: boolean;
  ngProbeLocations: string[];
  tsProbeLocations: string[];
  includeAutomaticOptionalChainCompletions: boolean;
}

export function parseCommandLine(argv: string[]): CommandLineOptions {
  return {
    help: hasArgument(argv, '--help'),
    ivy: !hasArgument(argv, '--viewEngine'),
    logFile: findArgument(argv, '--logFile'),
    logVerbosity: findArgument(argv, '--logVerbosity'),
    logToConsole: hasArgument(argv, '--logToConsole'),
    ngProbeLocations: parseStringArray(argv, '--ngProbeLocations'),
    tsProbeLocations: parseStringArray(argv, '--tsProbeLocations'),
    includeAutomaticOptionalChainCompletions:
        hasArgument(argv, '--includeAutomaticOptionalChainCompletions'),
  };
}

export function generateHelpMessage(argv: string[]) {
  return `Angular Language Service that implements the Language Server Protocol (LSP).

  Usage: ${argv[0]} ${argv[1]} [options]

  Options:
    --help: Prints help message.
    --viewEngine: Use legacy View Engine language service. Defaults to false.
    --logFile: Location to log messages. Logging to file is disabled if not provided.
    --logVerbosity: terse|normal|verbose|requestTime. See ts.server.LogLevel.
    --logToConsole: Enables logging to console via 'window/logMessage'. Defaults to false.
    --ngProbeLocations: Path of @angular/language-service. Required.
    --tsProbeLocations: Path of typescript. Required.

  Additional options supported by vscode-languageserver:
    --clientProcessId=<number>: Automatically kills the server if the client process dies.
    --node-ipc: Communicate using Node's IPC. This is the default.
    --stdio: Communicate over stdin/stdout.
    --socket=<number>: Communicate using Unix socket.
  `;
}

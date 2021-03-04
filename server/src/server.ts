/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {generateHelpMessage, parseCommandLine} from './cmdline_utils';
import {createLogger} from './logger';
import {ServerHost} from './server_host';
import {Session} from './session';
import {NGLANGSVC, resolveNgLangSvc, resolveTsServer} from './version_provider';

// Parse command line arguments
const options = parseCommandLine(process.argv);

if (options.help) {
  console.error(generateHelpMessage(process.argv));
  process.exit(0);
}

// Create a logger that logs to file. OK to emit verbose entries.
const logger = createLogger({
  logFile: options.logFile,
  logVerbosity: options.logVerbosity,
});

const ts = resolveTsServer(options.tsProbeLocations);
const ng = resolveNgLangSvc(options.ngProbeLocations, options.ivy);

// ServerHost provides native OS functionality
const host = new ServerHost(options.ivy);

// Establish a new server session that encapsulates lsp connection.
const session = new Session({
  host,
  logger,
  ngPlugin: NGLANGSVC,  // TypeScript allows only package names as plugin names.
  resolvedNgLsPath: ng.resolvedPath,
  resolvedTsLsPath: ts.resolvedPath,
  ivy: options.ivy,
  logToConsole: options.logToConsole,
});

// Log initialization info
session.info(`Angular language server process ID: ${process.pid}`);
session.info(`Using ${ts.name} v${ts.version} from ${ts.resolvedPath}`);
session.info(`Using ${ng.name} v${ng.version} from ${ng.resolvedPath}`);
session.info(`Log file: ${logger.getLogFileName()}`);
if (process.env.NG_DEBUG === 'true') {
  session.info('Angular Language Service is running under DEBUG mode');
}

session.listen();

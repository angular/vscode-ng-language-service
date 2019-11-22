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
import {resolveNgLangSvc, resolveTsServer} from './version_provider';

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
const ng = resolveNgLangSvc(options.ngProbeLocations);

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

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

function main() {
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

  const isG3 = ts.resolvedPath.includes('/google3/');

  // ServerHost provides native OS functionality
  const host = new ServerHost(isG3);

  // Establish a new server session that encapsulates lsp connection.
  const session = new Session({
    host,
    logger,
    // TypeScript allows only package names as plugin names.
    ngPlugin: '@angular/language-service',
    resolvedNgLsPath: ng.resolvedPath,
    ivy: isG3 ? true : options.ivy,
    logToConsole: options.logToConsole,
    includeAutomaticOptionalChainCompletions: options.includeAutomaticOptionalChainCompletions
  });

  // Log initialization info
  session.info(`Angular language server process ID: ${process.pid}`);
  session.info(`Using ${ts.name} v${ts.version} from ${ts.resolvedPath}`);
  session.info(`Using ${ng.name} v${ng.version} from ${ng.resolvedPath}`);
  if (logger.loggingEnabled()) {
    session.info(`Log file: ${logger.getLogFileName()}`);
  } else {
    session.info(`Logging is turned off. To enable, run command 'Open Angular server log'.`);
  }
  if (process.env.NG_DEBUG === 'true') {
    session.info('Angular Language Service is running under DEBUG mode');
  }

  session.listen();
}

main();
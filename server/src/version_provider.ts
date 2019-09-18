/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as path from 'path';

/**
 * Represents a valid directory where `@angular/language-service` could be
 * found, as well as its version.
 */
interface NgVersion {
  dirName: string;
  version?: string;
}

const NGLANGSVC = `@angular/language-service/package.json`;

export class NgVersionProvider {
  constructor(private readonly probeLocation?: string) {}

  /**
   * Return the version that is found via the probe location, if provided.
   */
  get bundledVersion(): NgVersion|undefined {
    if (!this.probeLocation) {
      return;
    }
    return this.resolve(this.probeLocation);
  }

  /**
   * Return the version that is found via current directory, if any.
   */
  get localVersion(): NgVersion|undefined {
    return this.resolve(process.cwd());
  }

  private resolve(dirName: string): NgVersion|undefined {
    // Here, use native NodeJS require instead of ServerHost.require because
    // we want the full path of the resolution provided by native
    // `require.resolve()`, which ServerHost does not provide.
    let result: NgVersion|undefined;
    try {
      // require.resolve() throws if module resolution fails.
      const resolutionPath = require.resolve(NGLANGSVC, {
        paths: [dirName],
      });
      if (!resolutionPath) {
        return;
      }
      result = {
        dirName: path.dirname(resolutionPath),
        version: undefined,
      };
      // require would throw if package.json is not strict JSON
      const packageJson = require(resolutionPath);
      if (packageJson && packageJson.version) {
        result.version = packageJson.version;
      }
    } finally {
      return result;
    }
  }
}

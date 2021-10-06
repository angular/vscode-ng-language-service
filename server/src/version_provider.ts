/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import * as path from 'path';

import {NodeModule, resolve, Version} from '../common/resolver';

const MIN_TS_VERSION = '4.3';
const MIN_NG_VERSION = '13.0';
const TSSERVERLIB = 'typescript/lib/tsserverlibrary';

/**
 * Resolve the node module with the specified `packageName` that satisfies
 * the specified minimum version.
 * @param packageName name of package to be resolved
 * @param minVersionStr minimum version
 * @param probeLocations locations to initiate node module resolution
 * @param rootPackage location of package.json. For example, the root package of
 * `typescript/lib/tsserverlibrary` is `typescript`.
 */
function resolveWithMinVersion(
    packageName: string, minVersionStr: string, probeLocations: string[],
    rootPackage: string): NodeModule {
  if (!packageName.startsWith(rootPackage)) {
    throw new Error(`${packageName} must be in the root package`);
  }
  const minVersion = new Version(minVersionStr);
  for (const location of probeLocations) {
    const nodeModule = resolve(packageName, location, rootPackage);
    if (nodeModule && nodeModule.version.greaterThanOrEqual(minVersion)) {
      return nodeModule;
    }
  }
  throw new Error(
      `Failed to resolve '${packageName}' with minimum version '${minVersion}' from ` +
      JSON.stringify(probeLocations, null, 2));
}

/**
 * Resolve `typescript/lib/tsserverlibrary` from the given locations.
 * @param probeLocations
 */
export function resolveTsServer(probeLocations: string[]): NodeModule {
  if (probeLocations.length > 0) {
    // The first probe location is `typescript.tsdk` if it is specified.
    const resolvedFromTsdk = resolveTsServerFromTsdk(probeLocations[0]);
    if (resolvedFromTsdk !== undefined) {
      return resolvedFromTsdk;
    }
  }
  return resolveWithMinVersion(TSSERVERLIB, MIN_TS_VERSION, probeLocations, 'typescript');
}

function resolveTsServerFromTsdk(tsdk: string): NodeModule|undefined {
  // `tsdk` is the folder path to the tsserver and lib*.d.ts files under a
  // TypeScript install, for example
  // - /google/src/head/depot/google3/third_party/javascript/node_modules/typescript/stable/lib
  if (!path.isAbsolute(tsdk)) {
    return undefined;
  }
  const tsserverlib = path.join(tsdk, 'tsserverlibrary.js');
  if (!fs.existsSync(tsserverlib)) {
    return undefined;
  }
  const packageJson = path.resolve(tsserverlib, '../../package.json');
  if (!fs.existsSync(packageJson)) {
    return undefined;
  }
  try {
    const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    return {
      name: TSSERVERLIB,
      resolvedPath: tsserverlib,
      version: new Version(json.version),
    };
  } catch {
    return undefined;
  }
}

/**
 * Resolve `@angular/language-service` from the given locations.
 * @param probeLocations locations from which resolution is attempted
 */
export function resolveNgLangSvc(probeLocations: string[]): NodeModule {
  const ngls = '@angular/language-service';
  return resolveWithMinVersion(ngls, MIN_NG_VERSION, probeLocations, ngls);
}

export function resolveNgcc(directory: string): NodeModule|undefined {
  return resolve('@angular/compiler-cli/ngcc/main-ngcc.js', directory, '@angular/compiler-cli');
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import {NodeModule, resolve, Version} from '../common/resolver';

const MIN_TS_VERSION = '4.2';
const MIN_NG_VERSION = '12.0';
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

/**
 * This uses a dynamic import to load a module which may be ESM.
 * CommonJS code can load ESM code via a dynamic import. Unfortunately, TypeScript
 * will currently, unconditionally downlevel dynamic import into a require call.
 * require calls cannot load ESM code and will result in a runtime error. To workaround
 * this, a Function constructor is used to prevent TypeScript from changing the dynamic import.
 * Once TypeScript provides support for keeping the dynamic import this workaround can
 * be dropped.
 *
 * @param modulePath The path of the module to load.
 * @returns A Promise that resolves to the dynamically imported module.
 */
export function loadEsmModule<T>(modulePath: string|URL): Promise<T> {
  return new Function('modulePath', `return import(modulePath);`)(modulePath) as Promise<T>;
}

export async function resolveNgcc(directory: string): Promise<NodeModule|undefined> {
  // Try to resolve ngcc from the new package format since the v13 release
  try {
    const ngcc = resolve('@angular/compiler-cli/ngcc', directory, '@angular/compiler-cli');
    if (ngcc === undefined) {
      throw new Error('Could not resolve ngcc');
    }

    // The Angular compiler-CLI package is strict ESM as of v13.
    const ngccModule = await loadEsmModule<{ngccMainFilePath: string | undefined}>(
        url.pathToFileURL(ngcc.resolvedPath));
    const resolvedPath = ngccModule.ngccMainFilePath;
    if (resolvedPath === undefined) {
      throw new Error('Could not resolve ngcc path.');
    }

    return {
      ...ngcc,
      resolvedPath,
    };
  } catch (e) {
    // Try to resolve ngcc through with pre-v13 package format
    return resolve('@angular/compiler-cli/ngcc/main-ngcc.js', directory, '@angular/compiler-cli');
  }
}
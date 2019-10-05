/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as path from 'path';

/**
 * Represents a valid node module that has been successfully resolved.
 */
export interface NodeModule {
  resolvedPath: string;
  version?: string;
}

function resolve(packageName: string, paths: string[]): NodeModule|undefined {
  try {
    // Here, use native NodeJS require instead of ServerHost.require because
    // we want the full path of the resolution provided by native
    // `require.resolve()`, which ServerHost does not provide.
    const resolvedPath = require.resolve(`${packageName}/package.json`, {paths});
    const packageJson = require(resolvedPath);
    return {
      resolvedPath: path.dirname(resolvedPath),
      version: packageJson.version,
    };
  } catch {
  }
}

function minVersion(nodeModule: NodeModule, minMajor: number): boolean {
  if (!nodeModule.version) {
    return false;
  }
  const [majorStr] = nodeModule.version.split('.');
  if (!majorStr) {
    return false;
  }
  const major = Number(majorStr);
  if (isNaN(major)) {
    return false;
  }
  return major >= minMajor;
}

/**
 * Resolve the node module with the specified `packageName` that satisfies
 * the specified minimum major version.
 * @param packageName
 * @param minMajor
 * @param probeLocations
 */
export function resolveWithMinMajor(
    packageName: string, minMajor: number, probeLocations: string[]): NodeModule {
  for (const location of probeLocations) {
    const nodeModule = resolve(packageName, [location]);
    if (!nodeModule) {
      continue;
    }
    if (minVersion(nodeModule, minMajor)) {
      return nodeModule;
    }
  }
  throw new Error(
      `Failed to resolve '${packageName}' with minimum major version '${minMajor}' from ` +
      JSON.stringify(probeLocations, null, 2));
}

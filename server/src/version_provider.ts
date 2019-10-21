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

export function minVersion(nodeModule: NodeModule, minMajor: number, minMinor: number): boolean {
  if (!nodeModule.version) {
    return false;
  }
  const [majorStr, minorStr] = nodeModule.version.split('.');
  if (!majorStr) {
    return false;
  }
  const major = Number(majorStr);
  const minor = Number(minorStr);
  if (isNaN(major) || isNaN(minor)) {
    return false;
  }
  return major > minMajor || (major == minMajor && minor >= minMinor);
}

/**
 * Resolve the node module with the specified `packageName` that satisfies
 * the specified minimum major and minor version.
 * @param packageName
 * @param probeLocations
 * @param minMajor
 * @param minMinor
 */
export function resolveWithMinVersion(
    packageName: string, probeLocations: string[], minMajor: number, minMinor: number): NodeModule {
  for (const location of probeLocations) {
    const nodeModule = resolve(packageName, [location]);
    if (!nodeModule) {
      continue;
    }
    if (minVersion(nodeModule, minMajor, minMinor)) {
      return nodeModule;
    }
  }
  throw new Error(
      `Failed to resolve '${packageName}' with minimum major '${minMajor}' and minor '${
          minMinor}' version from ` +
      JSON.stringify(probeLocations, null, 2));
}

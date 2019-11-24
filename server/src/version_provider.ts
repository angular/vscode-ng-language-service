/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

const MIN_TS_VERSION = '3.6';
const MIN_NG_VERSION = '9.0';

/**
 * Represents a valid node module that has been successfully resolved.
 */
interface NodeModule {
  resolvedPath: string;
  version: Version;
}

function resolve(packageName: string, location: string, rootPackage?: string): NodeModule|
    undefined {
  rootPackage = rootPackage || packageName;
  try {
    const packageJsonPath = require.resolve(`${rootPackage}/package.json`, {
      paths: [location],
    });
    const packageJson = require(packageJsonPath);
    const resolvedPath = require.resolve(packageName, {
      paths: [location],
    });
    return {
      resolvedPath,
      version: new Version(packageJson.version),
    };
  } catch {
  }
}

/**
 * Resolve the node module with the specified `packageName` that satisfies
 * the specified minimum version.
 * @param packageName name of package to be resolved
 * @param minVersionStr minimum version
 * @param probeLocations locations to initiate node module resolution
 * @param rootPackage location of package.json, if different from `packageName`
 */
function resolveWithMinVersion(
    packageName: string, minVersionStr: string, probeLocations: string[],
    rootPackage?: string): NodeModule {
  if (rootPackage && !packageName.startsWith(rootPackage)) {
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
  const tsserver = 'typescript/lib/tsserverlibrary';
  return resolveWithMinVersion(tsserver, MIN_TS_VERSION, probeLocations, 'typescript');
}

/**
 * Resolve `@angular/language-service` from the given locations.
 * @param probeLocations
 */
export function resolveNgLangSvc(probeLocations: string[]): NodeModule {
  const nglangsvc = '@angular/language-service';
  return resolveWithMinVersion(nglangsvc, MIN_NG_VERSION, probeLocations);
}

/**
 * Converts the specified string `a` to non-negative integer.
 * Returns -1 if the result is NaN.
 * @param a
 */
function parseNonNegativeInt(a: string): number {
  // parseInt() will try to convert as many as possible leading characters that
  // are digits. This means a string like "123abc" will be converted to 123.
  // For our use case, this is sufficient.
  const i = parseInt(a, 10 /* radix */);
  return isNaN(i) ? -1 : i;
}

export class Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;

  constructor(private readonly versionStr: string) {
    const [major, minor, patch] = Version.parseVersionStr(versionStr);
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  greaterThanOrEqual(other: Version): boolean {
    if (this.major < other.major) {
      return false;
    }
    if (this.major > other.major) {
      return true;
    }
    if (this.minor < other.minor) {
      return false;
    }
    if (this.minor > other.minor) {
      return true;
    }
    return this.patch >= other.patch;
  }

  toString(): string {
    return this.versionStr;
  }

  /**
   * Converts the specified `versionStr` to its number constituents. Invalid
   * number value is represented as negative number.
   * @param versionStr
   */
  static parseVersionStr(versionStr: string): [number, number, number] {
    const [major, minor, patch] = versionStr.split('.').map(parseNonNegativeInt);
    return [
      major === undefined ? 0 : major,
      minor === undefined ? 0 : minor,
      patch === undefined ? 0 : patch,
    ];
  }
}

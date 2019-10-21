/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {minVersion, NodeModule, resolveWithMinVersion} from '../version_provider';

describe('resolveWithMinVersion', () => {
  const probeLocations = [__dirname];

  it('should find typescript >= v2', () => {
    const result = resolveWithMinVersion('typescript', probeLocations, 2, 0);
    expect(result.version).toBe('3.6.4');
  });

  it('should find typescript v3', () => {
    const result = resolveWithMinVersion('typescript', probeLocations, 3, 6);
    expect(result.version).toBe('3.6.4');
  });

  it('should fail to find typescript v4', () => {
    expect(() => resolveWithMinVersion('typescript', probeLocations, 4, 0))
        .toThrowError(/^Failed to resolve 'typescript'/);
  });
});

describe('minVersion', () => {
  const nodeModule: NodeModule = {version: '2.5.4', resolvedPath: ''};

  it('should return true when minMajor = 2, minMinor = 5', () => {
    const result = minVersion(nodeModule, 2, 5);
    expect(result).toBeTruthy();
  });

  it('should return true when minMajor = 1, minMinor = 6', () => {
    const result = minVersion(nodeModule, 1, 6);
    expect(result).toBeTruthy();
  });

  it('should return true when minMajor = 1, minMinor = 4', () => {
    const result = minVersion(nodeModule, 1, 4);
    expect(result).toBeTruthy();
  });

  it('should return false when minMajor = 2, minMinor = 6', () => {
    const result = minVersion(nodeModule, 2, 6);
    expect(result).toBeFalsy();
  });

  it('should return false when minMajor = 3, minMinor = 0', () => {
    const result = minVersion(nodeModule, 3, 0);
    expect(result).toBeFalsy();
  });

  it('should return false when minMajor = 3, minMinor = 6', () => {
    const result = minVersion(nodeModule, 3, 6);
    expect(result).toBeFalsy();
  });
});
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {resolveWithMinMajor} from '../version_provider';

describe('resolveWithMinMajor', () => {
  const probeLocations = [__dirname];

  it('should find typescript >= v2', () => {
    const result = resolveWithMinMajor('typescript', 2, probeLocations);
    expect(result.version).toBe('3.6.4');
  });

  it('should find typescript v3', () => {
    const result = resolveWithMinMajor('typescript', 3, probeLocations);
    expect(result.version).toBe('3.6.4');
  });

  it('should fail to find typescript v4', () => {
    expect(() => resolveWithMinMajor('typescript', 4, probeLocations))
        .toThrowError(/^Failed to resolve 'typescript'/);
  });
});

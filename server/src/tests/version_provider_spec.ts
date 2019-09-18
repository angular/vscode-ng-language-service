/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgVersionProvider} from '../version_provider';

describe('NgVersionProvider', () => {
  const probeLocation = __dirname;

  it('should find bundled version', () => {
    const provider = new NgVersionProvider(probeLocation);
    const bundledVersion = provider.bundledVersion;
    expect(bundledVersion).toBeDefined();
    const {dirName, version} = bundledVersion!;
    expect(dirName).toMatch(/@angular\/language-service$/);
    expect(version).toBeTruthy();
  });

  it('should not find local version', () => {
    const provider = new NgVersionProvider(probeLocation);
    const localVersion = provider.localVersion;
    // Don't expect to find `@angular/language-service` in current directory.
    expect(localVersion).toBeUndefined();
  });
});

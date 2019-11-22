/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {parseCommandLine} from '../cmdline_utils';

describe('parseCommandLine', () => {
  it('should parse "help"', () => {
    const options = parseCommandLine(['--help']);
    expect(options.help).toBe(true);
  });

  it('should parse "logFile"', () => {
    const options = parseCommandLine(['--logFile', 'foo.log']);
    expect(options.logFile).toBe('foo.log');
  });

  it('should parse "logVerbosity"', () => {
    const options = parseCommandLine(['--logVerbosity', 'normal']);
    expect(options.logVerbosity).toBe('normal');
  });

  it('should parse "ngProbeLocations"', () => {
    const options = parseCommandLine(['--ngProbeLocations', '/foo,/bar']);
    expect(options.ngProbeLocations).toEqual(['/foo', '/bar']);
  });

  it('should parse "tsProbeLocations"', () => {
    const options = parseCommandLine(['--tsProbeLocations', '/baz,/qux']);
    expect(options.tsProbeLocations).toEqual(['/baz', '/qux']);
  });
});

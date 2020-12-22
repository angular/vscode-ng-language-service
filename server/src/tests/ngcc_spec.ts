/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as child_process from 'child_process';
import {EventEmitter} from 'events';
import {join, resolve} from 'path';

import {resolveAndRunNgcc} from '../ngcc';

const PACKAGE_ROOT = resolve(__dirname, '../../..');
const WORKSPACE_ROOT = join(PACKAGE_ROOT, 'integration', 'workspace');
const PROJECT = join(WORKSPACE_ROOT, 'projects', 'demo');

describe('resolveAndRunNgcc', () => {
  it('runs ngcc from node_modules where ngcc is resolved to', async () => {
    const fakeChild = new EventEmitter();
    const spy = spyOn(child_process, 'fork').and.returnValue(fakeChild as any);
    // Note that tsconfig.json is in the project directory
    const tsconfig = join(PROJECT, 'tsconfig.json');
    const promise = resolveAndRunNgcc(tsconfig, {report() {}});
    fakeChild.emit('close', 0 /* exit code */);
    await expectAsync(promise).toBeResolved();
    expect(spy.calls.count()).toBe(1);
    // First arg is the ngcc binary, second arg is program arguments, third
    // arg is fork options.
    const {cwd} = spy.calls.argsFor(0)[2]!;
    // cwd for ngcc should be in the workspace directory
    expect(cwd).toBe(WORKSPACE_ROOT);
  });
});

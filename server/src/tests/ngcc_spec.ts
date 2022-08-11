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
import {interval, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {resolveAndRunNgcc} from '../ngcc';

const IS_BAZEL = !!process.env['TEST_TARGET'];

// Outside of bazel there is an additional `dist/` path segment
const PACKAGE_ROOT = IS_BAZEL ? resolve(__dirname, '../../..') : resolve(__dirname, '../../../..');
const WORKSPACE_ROOT = join(PACKAGE_ROOT, 'integration', 'workspace');
const PROJECT = join(WORKSPACE_ROOT, 'projects', 'demo');
const PRE_APF_PROJECT = join(PACKAGE_ROOT, 'integration', 'pre_apf_project');

describe('resolveAndRunNgcc', () => {
  const afterEach$ = new Subject<void>();
  afterEach(() => {
    afterEach$.next();
  });

  it('runs ngcc from node_modules where ngcc is resolved to', async () => {
    const fakeChild = new EventEmitter();
    const spy = spyOn(child_process, 'fork').and.returnValue(fakeChild as any);
    // Note that tsconfig.json is in the project directory
    const tsconfig = join(PROJECT, 'tsconfig.json');
    // Because resolveNgcc is async, we need to periodically emit `close` from the child since
    // `resolveAndRunNgcc` subscribes after the async resolveNgcc.
    interval(500).pipe(takeUntil(afterEach$)).subscribe(() => {
      fakeChild.emit('close', 0 /* exit code */);
    });
    const promise = resolveAndRunNgcc(tsconfig, {report() {}});
    await expectAsync(promise).toBeResolved();
    expect(spy.calls.count()).toBe(1);
    // First arg is the ngcc binary, second arg is program arguments, third
    // arg is fork options.
    const {cwd} = spy.calls.argsFor(0)[2]!;
    // cwd for ngcc should be in the workspace directory
    expect(cwd).toBe(WORKSPACE_ROOT);
  });

  it('runs ngcc from node_modules for v12 project where ngcc is resolved to', async () => {
    const fakeChild = new EventEmitter();
    const spy = spyOn(child_process, 'fork').and.returnValue(fakeChild as any);
    // Note that tsconfig.json is in the project directory
    const tsconfig = join(PRE_APF_PROJECT, 'tsconfig.json');
    // Because resolveNgcc is async, we need to periodically emit `close` from the child since
    // `resolveAndRunNgcc` subscribes after the async resolveNgcc.
    interval(500).pipe(takeUntil(afterEach$)).subscribe(() => {
      fakeChild.emit('close', 0 /* exit code */);
    });
    const promise = resolveAndRunNgcc(tsconfig, {report() {}});
    await expectAsync(promise).toBeResolved();
    expect(spy.calls.count()).toBe(1);
    // First arg is the ngcc binary, second arg is program arguments, third
    // arg is fork options.
    const {cwd} = spy.calls.argsFor(0)[2]!;
    // cwd for ngcc should be in the workspace directory
    expect(cwd).toBe(PRE_APF_PROJECT);
  });
});

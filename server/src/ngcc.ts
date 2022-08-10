/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {fork} from 'child_process';
import {dirname, resolve} from 'path';

import {Version} from '../../common/resolver';

import {resolveNgcc} from './version_provider';

interface Progress {
  report(msg: string): void;
}

/**
 * Resolve ngcc from the directory that contains the specified `tsconfig` and
 * run ngcc.
 */
export async function resolveAndRunNgcc(tsconfig: string, progress: Progress): Promise<void> {
  const directory = dirname(tsconfig);
  const ngcc = await resolveNgcc(directory);
  if (!ngcc) {
    throw new Error(`Failed to resolve ngcc from ${directory}`);
  }
  const index = ngcc.resolvedPath.indexOf('node_modules');
  // By default, ngcc assumes the node_modules directory that it needs to process
  // is in the cwd. In our case, we should set cwd to the directory where ngcc
  // is resolved to, not the directory where tsconfig.json is located. See
  // https://github.com/angular/angular/blob/e23fd1f38205410e0ecb601ec73847cea2dea2a8/packages/compiler-cli/ngcc/src/command_line_options.ts#L18-L24
  const cwd = index > 0 ? ngcc.resolvedPath.slice(0, index) : process.cwd();
  const args: string[] = [
    '--tsconfig',
    tsconfig,
  ];
  if (ngcc.version.greaterThanOrEqual(new Version('11.2.4'))) {
    // See https://github.com/angular/angular/commit/241784bde8582bcbc00b8a95acdeb3b0d38fbec6
    args.push('--typings-only');
  }
  const childProcess = fork(ngcc.resolvedPath, args, {
    cwd: resolve(cwd),
    silent: true,  // pipe stderr and stdout so that we can report progress
    execArgv: [],  // do not inherit flags like --inspect from parent process
  });

  let stderr = '';
  childProcess.stderr?.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  childProcess.stdout?.on('data', (data: Buffer) => {
    for (let entry of data.toString().split('\n')) {
      entry = entry.trim();
      if (entry) {
        progress.report(entry);
      }
    }
  });

  return new Promise((resolve, reject) => {
    childProcess.on('error', (error: Error) => {
      reject(error);
    });
    childProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
            new Error(`ngcc for ${tsconfig} returned exit code ${code}, stderr: ${stderr.trim()}`));
      }
    });
  });
}

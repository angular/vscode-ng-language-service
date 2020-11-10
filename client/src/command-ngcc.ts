/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {spawn} from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

function resolveNgccFrom(directory: string): string|null {
  try {
    return require.resolve(`@angular/compiler-cli/ngcc/main-ngcc.js`, {
      paths: [directory],
    });
  } catch {
    return null;
  }
}

/**
 * Resolve ngcc from the directory that contains the specified `tsconfig` and
 * run ngcc.
 */
export async function resolveAndRunNgcc(
    tsconfig: string, progress: vscode.Progress<string>): Promise<void> {
  const directory = path.dirname(tsconfig);
  const ngcc = resolveNgccFrom(directory);
  if (!ngcc) {
    throw new Error(`Failed to resolve ngcc from ${directory}`);
  }
  const childProcess = spawn(
      ngcc,
      [
        '--tsconfig',
        tsconfig,
      ],
      {
        cwd: directory,
      });

  childProcess.stdout.on('data', (data: Buffer) => {
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
        throw new Error(`ngcc for ${tsconfig} returned exit code ${code}`);
      }
    });
  });
}

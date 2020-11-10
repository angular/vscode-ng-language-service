/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as vscode from 'vscode';

const EMPTY_DISPOSABLE = vscode.Disposable.from();

class ProgressReporter implements vscode.Progress<unknown> {
  private lastMessage: vscode.Disposable = EMPTY_DISPOSABLE;

  report(value: unknown) {
    this.lastMessage.dispose();  // clear the last message
    // See https://code.visualstudio.com/api/references/icons-in-labels for
    // icons available in vscode. "~spin" animates the icon.
    this.lastMessage = vscode.window.setStatusBarMessage(`$(loading~spin) Angular: ${value}`);
  }

  finish() {
    this.lastMessage.dispose();
    this.lastMessage = EMPTY_DISPOSABLE;
  }
}

interface Task<R> {
  (progress: vscode.Progress<string>): Promise<R>;
}

/**
 * Show progress in the editor. Progress is shown while running the given `task`
 * callback and while the promise it returns is in the pending state.
 * If the given `task` returns a rejected promise, this function will reject with
 * the same promise.
 */
export async function withProgress<R>(options: vscode.ProgressOptions, task: Task<R>): Promise<R> {
  // Although not strictly compatible, the signature of this function follows
  // the signature of vscode.window.withProgress() to make it easier to switch
  // to the official API if we choose to do so later.
  const reporter = new ProgressReporter();
  if (options.title) {
    reporter.report(options.title);
  }
  try {
    return await task(reporter);
  } finally {
    reporter.finish();
  }
}

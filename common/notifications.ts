/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NotificationType0} from 'vscode-jsonrpc';

export const projectLoadingNotification = {
  start: new NotificationType0('angular/projectLoadingStart'),
  finish: new NotificationType0('angular/projectLoadingFinish')
};

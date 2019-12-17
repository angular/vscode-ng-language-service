/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NotificationType0} from 'vscode-languageserver';

export const projectLoadingNotification = {
  start: new NotificationType0<string>('angular-language-service/projectLoadingStart'),
  finish: new NotificationType0<string>('angular-language-service/projectLoadingFinish')
};

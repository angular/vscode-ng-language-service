/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NotificationType, NotificationType0} from 'vscode-jsonrpc';

export const ProjectLoadingStart = new NotificationType0('angular/projectLoadingStart');
export const ProjectLoadingFinish = new NotificationType0('angular/projectLoadingFinish');

export interface ProjectLanguageServiceParams {
  projectName: string;
  languageServiceEnabled: boolean;
}

export const ProjectLanguageService =
    new NotificationType<ProjectLanguageServiceParams>('angular/projectLanguageService');

export interface SuggestStrictModeParams {
  configFilePath: string;
  message: string;
}

export const SuggestStrictMode =
    new NotificationType<SuggestStrictModeParams>('angular/suggestStrictMode');

// Report the end of `NGCC` progress and Only used by the `ivy_spec.ts`.
export const NgccProgressEnd =
    new NotificationType<{configFilePath: string}>('angular/NgccProgressEnd');

export const OpenOutputChannel = new NotificationType('angular/OpenOutputChannel');
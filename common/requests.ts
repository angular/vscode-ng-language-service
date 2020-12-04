/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as lsp from 'vscode-languageserver-protocol';

export interface GetTcbParams {
  textDocument: lsp.TextDocumentIdentifier;
  position: lsp.Position;
}

export const GetTcbRequest =
    new lsp.RequestType<GetTcbParams, GetTcbResponse|null, /* error */ void>('angular/getTcb');

export interface GetTcbResponse {
  uri: lsp.DocumentUri;
  content: string;
  selections: lsp.Range[]
}

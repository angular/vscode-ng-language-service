/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { NgLanguageService } from '@angular/language-service/api';
import * as ts from 'typescript/lib/tsserverlibrary';
import * as lsp from 'vscode-languageserver/node';

export function getSemanticTokens(
    languageService: NgLanguageService, classifications: ts.Classifications, script: ts.server.ScriptInfo): lsp.SemanticTokens {
  const spans = classifications.spans;
  const builder = new lsp.SemanticTokensBuilder();

  for (let i = 0; i < spans.length;) {
    const offset = spans[i++];
    const length = spans[i++];
    const classification = spans[i++];

    const tokenType = languageService.getTokenTypeFromClassification(classification);
    if (tokenType === undefined) {
      continue;
    }

    const tokenModifiers = languageService.getTokenModifierFromClassification(classification);

    const startPos = script.positionToLineOffset(offset);
    startPos.line -= 1;
    startPos.offset -= 1;

    const endPos = script.positionToLineOffset(offset + length);
    endPos.line -= 1;
    endPos.offset -= 1;

    for (let line = startPos.line; line <= endPos.line; line++) {
      const startCharacter = line === startPos.line ? startPos.offset : 0;
      const endCharacter =
          line === endPos.line ? endPos.offset : script.lineToTextSpan(line - 1).length;
      builder.push(line, startCharacter, endCharacter - startCharacter, tokenType, tokenModifiers);
    }
  }

  return builder.build();
}

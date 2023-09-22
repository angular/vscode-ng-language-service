/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as vscode from 'vscode';
import {DocumentUri, TextDocument} from 'vscode-languageserver-textdocument';

import {isInsideComponentDecorator, isInsideInlineTemplateRegion} from '../embedded_support';

describe('embedded language support', () => {
  describe('isInsideInlineTemplateRegion', () => {
    it('empty file', () => {
      test('¦', isInsideInlineTemplateRegion, false);
    });

    it('just after template', () => {
      test(`template: '<div></div>'¦`, isInsideInlineTemplateRegion, false);
    });

    it('just before template', () => {
      // Note that while it seems that this should be `false`, we should still consider this inside
      // the string because the visual mode of vim appears to have a position on top of the open
      // quote while the cursor position is before it.
      test(`template: ¦'<div></div>'`, isInsideInlineTemplateRegion, true);
    });

    it('two spaces before template', () => {
      test(`template:¦ '<div></div>'`, isInsideInlineTemplateRegion, false);
    });

    it('at beginning of template', () => {
      test(`template: '¦<div></div>'`, isInsideInlineTemplateRegion, true);
    });

    it('at end of template', () => {
      test(`template: '<div></div>¦'`, isInsideInlineTemplateRegion, true);
    });

    it('works for inline templates after a template string', () => {
      test(
          'const x = `${""}`;\n' +
              'template: `hello ¦world`',
          isInsideInlineTemplateRegion, true);
    });

    it('works for inline templates after a tagged template string inside tagged template string',
       () => {
         test(
             'const x = `${`${""}`}`;\n' +
                 'template: `hello ¦world`',
             isInsideInlineTemplateRegion, true);
       });
  });

  describe('isInsideAngularContext', () => {
    it('empty file', () => {
      test('¦', isInsideComponentDecorator, false);
    });

    it('just after template', () => {
      test(`template: '<div></div>'¦`, isInsideComponentDecorator, false);
    });

    it('inside template', () => {
      test(`template: '<div>¦</div>'`, isInsideComponentDecorator, true);
    });

    it('just after templateUrl', () => {
      test(`templateUrl: './abc.html'¦`, isInsideComponentDecorator, false);
    });

    it('inside templateUrl', () => {
      test(`templateUrl: './abc¦.html'`, isInsideComponentDecorator, true);
    });

    it('just after styleUrls', () => {
      test(`styleUrls: ['./abc.css']¦`, isInsideComponentDecorator, false);
    });

    it('inside first item of styleUrls', () => {
      test(`styleUrls: ['./abc.c¦ss', 'def.css']`, isInsideComponentDecorator, true);
    });

    it('inside second item of styleUrls', () => {
      test(`styleUrls: ['./abc.css', 'def¦.css']`, isInsideComponentDecorator, true);
    });

    it('inside second item of styleUrls, when first is complicated function', () => {
      test(
          `styleUrls: [getCss({strict: true, dirs: ['apple', 'banana']}), 'def¦.css']`,
          isInsideComponentDecorator, true);
    });

    it('inside non-string item of styleUrls', () => {
      test(
          `styleUrls: [getCss({strict: true¦, dirs: ['apple', 'banana']}), 'def.css']`,
          isInsideComponentDecorator, false);
    });
  });
});

function test(
    fileWithCursor: string,
    testFn: (doc: vscode.TextDocument, position: vscode.Position) => boolean,
    expectation: boolean): void {
  const {cursor, text} = extractCursorInfo(fileWithCursor);
  const vdoc = TextDocument.create('test' as DocumentUri, 'typescript', 0, text) as {} as
      vscode.TextDocument;
  const actual = testFn(vdoc, vdoc.positionAt(cursor));
  expect(actual).toBe(expectation);
}

/**
 * Given a text snippet which contains exactly one cursor symbol ('¦'), extract both the offset of
 * that cursor within the text as well as the text snippet without the cursor.
 */
function extractCursorInfo(textWithCursor: string): {cursor: number, text: string} {
  const cursor = textWithCursor.indexOf('¦');
  if (cursor === -1 || textWithCursor.indexOf('¦', cursor + 1) !== -1) {
    throw new Error(`Expected to find exactly one cursor symbol '¦'`);
  }

  return {
    cursor,
    text: textWithCursor.substr(0, cursor) + textWithCursor.substr(cursor + 1),
  };
}

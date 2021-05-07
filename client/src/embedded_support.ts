/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import * as vscode from 'vscode';

/** Determines if the position is inside an inline template. */
export function isInsideInlineTemplateRegion(
    document: vscode.TextDocument, position: vscode.Position): boolean {
  if (document.languageId !== 'typescript') {
    return true;
  }
  return isPropertyAssignmentToStringOrStringInArray(
      document.getText(), document.offsetAt(position), ['template']);
}

/** Determines if the position is inside an inline template, templateUrl, or string in styleUrls. */
export function isInsideComponentDecorator(
    document: vscode.TextDocument, position: vscode.Position): boolean {
  if (document.languageId !== 'typescript') {
    return true;
  }
  return isPropertyAssignmentToStringOrStringInArray(
      document.getText(), document.offsetAt(position), ['template', 'templateUrl', 'styleUrls']);
}

/**
 * Determines if the position is inside a string literal. Returns `true` if the document language is
 * not TypeScript.
 */
export function isInsideStringLiteral(
    document: vscode.TextDocument, position: vscode.Position): boolean {
  if (document.languageId !== 'typescript') {
    return true;
  }
  const offset = document.offsetAt(position);
  const scanner = ts.createScanner(ts.ScriptTarget.ESNext, true /* skipTrivia */);
  scanner.setText(document.getText());

  let token: ts.SyntaxKind = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken && scanner.getStartPos() < offset) {
    const isStringToken = token === ts.SyntaxKind.StringLiteral ||
        token === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
    const isCursorInToken = scanner.getStartPos() <= offset &&
        scanner.getStartPos() + scanner.getTokenText().length >= offset;
    if (isCursorInToken && isStringToken) {
      return true;
    }
    token = scanner.scan();
  }
  return false;
}

/**
 * Basic scanner to determine if we're inside a string of a property with one of the given names.
 *
 * This scanner is not currently robust or perfect but provides us with an accurate answer _most_ of
 * the time.
 *
 * False positives are OK here. Though this will give some false positives for determining if a
 * position is within an Angular context, i.e. an object like `{template: ''}` that is not inside an
 * `@Component` or `{styleUrls: [someFunction('stringL¦iteral')]}`, the @angular/language-service
 * will always give us the correct answer. This helper gives us a quick win for optimizing the
 * number of requests we send to the server.
 */
function isPropertyAssignmentToStringOrStringInArray(
    documentText: string, offset: number, propertyAssignmentNames: string[]): boolean {
  const scanner = ts.createScanner(ts.ScriptTarget.ESNext, true /* skipTrivia */);
  scanner.setText(documentText);

  let token: ts.SyntaxKind = scanner.scan();
  let lastToken: ts.SyntaxKind|undefined;
  let lastTokenText: string|undefined;
  let unclosedBraces = 0;
  let unclosedBrackets = 0;
  let propertyAssignmentContext = false;
  while (token !== ts.SyntaxKind.EndOfFileToken && scanner.getStartPos() < offset) {
    if (lastToken === ts.SyntaxKind.Identifier && lastTokenText !== undefined &&
        propertyAssignmentNames.includes(lastTokenText) && token === ts.SyntaxKind.ColonToken) {
      propertyAssignmentContext = true;
      token = scanner.scan();
      continue;
    }
    if (unclosedBraces === 0 && unclosedBrackets === 0 && isPropertyAssignmentTerminator(token)) {
      propertyAssignmentContext = false;
    }

    if (token === ts.SyntaxKind.OpenBracketToken) {
      unclosedBrackets++;
    } else if (token === ts.SyntaxKind.OpenBraceToken) {
      unclosedBraces++;
    } else if (token === ts.SyntaxKind.CloseBracketToken) {
      unclosedBrackets--;
    } else if (token === ts.SyntaxKind.CloseBraceToken) {
      unclosedBraces--;
    }

    const isStringToken = token === ts.SyntaxKind.StringLiteral ||
        token === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
    const isCursorInToken = scanner.getStartPos() <= offset &&
        scanner.getStartPos() + scanner.getTokenText().length >= offset;
    if (propertyAssignmentContext && isCursorInToken && isStringToken) {
      return true;
    }

    lastTokenText = scanner.getTokenText();
    lastToken = token;
    token = scanner.scan();
  }

  return false;
}

function isPropertyAssignmentTerminator(token: ts.SyntaxKind) {
  return token === ts.SyntaxKind.EndOfFileToken || token === ts.SyntaxKind.CommaToken ||
      token === ts.SyntaxKind.SemicolonToken || token === ts.SyntaxKind.CloseBraceToken;
}
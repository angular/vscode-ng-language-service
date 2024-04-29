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
  const node = getNodeAtDocumentPosition(document, position);

  if (!node) {
    return false;
  }

  return getPropertyAssignmentFromValue(node, 'template') !== null;
}

/** Determines if the position is inside an inline template, templateUrl, or string in styleUrls. */
export function isInsideComponentDecorator(
    document: vscode.TextDocument, position: vscode.Position): boolean {
  if (document.languageId !== 'typescript') {
    return true;
  }

  const node = getNodeAtDocumentPosition(document, position);
  if (!node) {
    return false;
  }
  const assignment = getPropertyAssignmentFromValue(node, 'template') ??
      getPropertyAssignmentFromValue(node, 'templateUrl') ??
      // `node.parent` is used because the string is a child of an array element and we want to get
      // the property name
      getPropertyAssignmentFromValue(node.parent, 'styleUrls') ??
      getPropertyAssignmentFromValue(node, 'styleUrl');
  return assignment !== null;
}

/**
 * Determines if the position is inside a string literal. Returns `true` if the document language
 * is not TypeScript.
 */
export function isInsideStringLiteral(
    document: vscode.TextDocument, position: vscode.Position): boolean {
  if (document.languageId !== 'typescript') {
    return true;
  }
  const node = getNodeAtDocumentPosition(document, position);

  if (!node) {
    return false;
  }

  return ts.isStringLiteralLike(node);
}

/**
 * Return the node that most tightly encompasses the specified `position`.
 * @param node The starting node to start the top-down search.
 * @param position The target position within the `node`.
 */
function findTightestNodeAtPosition(node: ts.Node, position: number): ts.Node|undefined {
  if (node.getStart() <= position && position < node.getEnd()) {
    return node.forEachChild(c => findTightestNodeAtPosition(c, position)) ?? node;
  }
  return undefined;
}

/**
 * Returns a property assignment from the assignment value if the property name
 * matches the specified `key`, or `null` if there is no match.
 */
function getPropertyAssignmentFromValue(value: ts.Node, key: string): ts.PropertyAssignment|null {
  const propAssignment = value.parent;
  if (!propAssignment || !ts.isPropertyAssignment(propAssignment) ||
      propAssignment.name.getText() !== key) {
    return null;
  }
  return propAssignment;
}

type NgLSClientSourceFile = ts.SourceFile&{[NgLSClientSourceFileVersion]: number};

/**
 * The `TextDocument` is not extensible, so the `WeakMap` is used here.
 */
const ngLSClientSourceFileMap = new WeakMap<vscode.TextDocument, NgLSClientSourceFile>();
const NgLSClientSourceFileVersion = Symbol('NgLSClientSourceFileVersion');

/**
 *
 * Parse the document to `SourceFile` and return the node at the document position.
 */
function getNodeAtDocumentPosition(
    document: vscode.TextDocument, position: vscode.Position): ts.Node|undefined {
  const offset = document.offsetAt(position);

  let sourceFile = ngLSClientSourceFileMap.get(document);
  if (!sourceFile || sourceFile[NgLSClientSourceFileVersion] !== document.version) {
    sourceFile =
        ts.createSourceFile(
            document.fileName, document.getText(), {
              languageVersion: ts.ScriptTarget.ESNext,
              jsDocParsingMode: ts.JSDocParsingMode.ParseNone,
            },
            /** setParentNodes */
            true /** If not set, the `findTightestNodeAtPosition` will throw an error */) as
        NgLSClientSourceFile;
    sourceFile[NgLSClientSourceFileVersion] = document.version;

    ngLSClientSourceFileMap.set(document, sourceFile);
  }

  return findTightestNodeAtPosition(sourceFile, offset);
}

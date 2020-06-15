/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript/lib/tsserverlibrary';
import * as lsp from 'vscode-languageserver';

import {tsTextSpanToLspRange} from './utils';

// TODO: Move this to `@angular/language-service`.
enum CompletionKind {
  attribute = 'attribute',
  htmlAttribute = 'html attribute',
  property = 'property',
  component = 'component',
  element = 'element',
  key = 'key',
  method = 'method',
  pipe = 'pipe',
  type = 'type',
  reference = 'reference',
  variable = 'variable',
  entity = 'entity',
}

/**
 * Convert Angular's CompletionKind to LSP CompletionItemKind.
 * @param kind Angular's CompletionKind
 */
function ngCompletionKindToLspCompletionItemKind(kind: CompletionKind): lsp.CompletionItemKind {
  switch (kind) {
    case CompletionKind.attribute:
    case CompletionKind.htmlAttribute:
    case CompletionKind.property:
      return lsp.CompletionItemKind.Property;
    case CompletionKind.component:
    case CompletionKind.element:
    case CompletionKind.key:
      return lsp.CompletionItemKind.Class;
    case CompletionKind.method:
      return lsp.CompletionItemKind.Method;
    case CompletionKind.pipe:
      return lsp.CompletionItemKind.Function;
    case CompletionKind.type:
      return lsp.CompletionItemKind.Interface;
    case CompletionKind.reference:
    case CompletionKind.variable:
      return lsp.CompletionItemKind.Variable;
    case CompletionKind.entity:
    default:
      return lsp.CompletionItemKind.Text;
  }
}

/**
 * Convert ts.CompletionEntry to LSP Completion Item.
 * @param entry completion entry
 * @param position position where completion is requested.
 * @param scriptInfo
 */
export function tsCompletionEntryToLspCompletionItem(
    entry: ts.CompletionEntry, position: lsp.Position,
    scriptInfo: ts.server.ScriptInfo): lsp.CompletionItem {
  const item = lsp.CompletionItem.create(entry.name);
  // Even though `entry.kind` is typed as ts.ScriptElementKind, it's
  // really Angular's CompletionKind. This is because ts.ScriptElementKind does
  // not sufficiently capture the HTML entities.
  // This is a limitation of being a tsserver plugin.
  const kind = entry.kind as unknown as CompletionKind;
  item.kind = ngCompletionKindToLspCompletionItemKind(kind);
  item.detail = entry.kind;
  item.sortText = entry.sortText;
  // Text that actually gets inserted to the document. It could be different
  // from 'entry.name'. For example, a method name could be 'greet', but the
  // insertText is 'greet()'.
  let insertText = entry.insertText || entry.name;
  let replaceSpan = entry.replacementSpan;
  if (kind === CompletionKind.attribute) {
    // <div [(ng|)]=></div>
    //      ^-------------- start
    //             ^------- end
    let start = scriptInfo.lineOffsetToPosition(position.line + 1, position.character) - 1;
    let end = scriptInfo.lineOffsetToPosition(position.line + 1, position.character) + 4;
    if (replaceSpan) {
      start = replaceSpan.start - 2;
      end = replaceSpan.start + replaceSpan.length + 3;
    }
    const attributeText = scriptInfo.getSnapshot().getText(start, end);
    switch (attributeText[1]) {
      case '*':
      case '-':
        // *ngI| => *ngIf="|"
        // on-cli| => on-click="|"
        if (attributeText[attributeText.length - 3] !== '=') {
          item.insertTextFormat = lsp.InsertTextFormat.Snippet;
          insertText = `${insertText}="\${0}"`;
          replaceSpan = {start: start + 2, length: end - start - 5};
        }
        break;
      case '[':
        // [ngMo|] => [ngModel]="|"
        if (attributeText[attributeText.length - 2] !== '=') {
          item.insertTextFormat = lsp.InsertTextFormat.Snippet;
          insertText = `${insertText}]="\${0}"`;
          replaceSpan = {start: start + 2, length: end - start - 4};
        }
        break;
      case '(':
        if (attributeText[0] === '[') {
          // [(ngMod|)] => [(ngModel)]="|"
          if (attributeText[attributeText.length - 1] !== '=') {
            item.insertTextFormat = lsp.InsertTextFormat.Snippet;
            insertText = `${insertText})]="\${0}"`;
            replaceSpan = {start: start + 2, length: end - start - 3};
          }
        } else {
          // (clic|) => (click)="|"
          if (attributeText[attributeText.length - 2] !== '=') {
            item.insertTextFormat = lsp.InsertTextFormat.Snippet;
            insertText = `${insertText})="\${0}"`;
            replaceSpan = {start: start + 2, length: end - start - 4};
          }
        }
        break;
      default:
        break;
    }
  }

  if (kind === CompletionKind.method) {
    let start = scriptInfo.lineOffsetToPosition(position.line + 1, position.character) + 1;
    let end = scriptInfo.lineOffsetToPosition(position.line + 1, position.character) + 2;
    if (replaceSpan) {
      start = replaceSpan.start;
      end = replaceSpan.start + replaceSpan.length + 1;
    }
    const methodText = scriptInfo.getSnapshot().getText(start, end);
    if (methodText.endsWith('(')) {
      // meth|() => method(|)
      replaceSpan = {start: start, length: end - start};
      insertText = insertText.slice(0, insertText.length - 1) + '\${0}';
    } else {
      // meth| => method(|)
      insertText = insertText.slice(0, insertText.length - 1) + '\${0})';
    }
    item.insertTextFormat = lsp.InsertTextFormat.Snippet;
  }

  item.textEdit = replaceSpan ?
      lsp.TextEdit.replace(tsTextSpanToLspRange(scriptInfo, replaceSpan), insertText) :
      lsp.TextEdit.insert(position, insertText);
  return item;
}

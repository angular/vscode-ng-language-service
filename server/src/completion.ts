import * as lsp from 'vscode-languageserver';

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
function ngCompletionKindToLspCompletionItemKind(kind: CompletionKind):
    lsp.CompletionItemKind {
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
 */
export function tsCompletionEntryToLspCompletionItem(
    entry: ts.CompletionEntry, position: lsp.Position): lsp.CompletionItem {
  const item = lsp.CompletionItem.create(entry.name);
  // Even though `entry.kind` is typed as ts.ScriptElementKind, it's
  // really Angular's CompletionKind. This is because ts.ScriptElementKind does
  // not sufficiently capture the HTML entities.
  // This is a limitation of being a tsserver plugin.
  const kind = entry.kind as unknown as CompletionKind;
  item.kind = ngCompletionKindToLspCompletionItemKind(kind);
  item.detail = entry.kind;
  item.sortText = entry.sortText;
  item.textEdit = lsp.TextEdit.insert(position, entry.name);
  return item;
}

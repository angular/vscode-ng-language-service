import * as vscode from 'vscode';
import {APP_COMPONENT, FOO_TEMPLATE} from '../test_constants';

export const COMPLETION_COMMAND = 'vscode.executeCompletionItemProvider';
export const HOVER_COMMAND = 'vscode.executeHoverProvider';
export const DEFINITION_COMMAND = 'vscode.executeDefinitionProvider';
export const APP_COMPONENT_URI = vscode.Uri.file(APP_COMPONENT);
export const FOO_TEMPLATE_URI = vscode.Uri.file(FOO_TEMPLATE);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function activate(uri: vscode.Uri) {
  await vscode.window.showTextDocument(uri);
  await sleep(20 * 1000);  // Wait for server activation, including ngcc run
}

import * as path from 'path';
import * as vscode from 'vscode';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function activate(uri: vscode.Uri) {
  const ext = vscode.extensions.getExtension('Angular.ng-template')!;
  await ext.activate();
  try {
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);
    await sleep(2000);  // Wait for server activation
  } catch (e) {
    console.error(e);
  }
}

import * as vscode from 'vscode';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function activate(uri: vscode.Uri) {
  await vscode.window.showTextDocument(uri);
  await sleep(3 * 1000);  // Wait for server activation
}

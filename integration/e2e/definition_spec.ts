import * as vscode from 'vscode';
import {APP_COMPONENT} from '../test_constants';
import {activate} from './helper';

const DEFINITION_COMMAND = 'vscode.executeDefinitionProvider';

describe('Angular LS', () => {
  it(`returns definition for variable in template`, async () => {
    const docUri = vscode.Uri.file(APP_COMPONENT);

    // vscode Position is zero-based
    //   template: `<h1>Hello {{name}}</h1>`,
    //                          ^-------- here
    const position = new vscode.Position(4, 25);

    await activate(docUri);

    // For a complete list of standard commands, see
    // https://code.visualstudio.com/api/references/commands
    const definitions = await vscode.commands.executeCommand<vscode.LocationLink[]>(
        DEFINITION_COMMAND, docUri, position);
    expect(definitions?.length).toBe(1);
    const def = definitions![0];
    expect(def.targetUri.fsPath).toBe(APP_COMPONENT);  // in the same document
    const {start, end} = def.targetRange;
    // Should start and end on line 6
    expect(start.line).toBe(7);
    expect(end.line).toBe(7);
    expect(start.character).toBe(2);
    expect(end.character).toBe(start.character + `name`.length);
  });
});

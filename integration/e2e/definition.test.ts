import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import {activate} from './helper';

const DEFINITION_COMMAND = 'vscode.executeDefinitionProvider';

describe('Angular LS', () => {
  it(`returns definition for variable in template`, async () => {
    const docPath = path.resolve(__dirname, '../../project/app/app.component.ts');
    const docUri = vscode.Uri.file(docPath);

    // vscode Position is zero-based
    //   template: `<h1>Hello {{name}}</h1>`,
    //                          ^-------- here
    const position = new vscode.Position(4, 25);

    await activate(docUri);

    // For a complete list of standard commands, see
    // https://code.visualstudio.com/api/references/commands
    const definitions = await vscode.commands.executeCommand(
                            DEFINITION_COMMAND, docUri, position) as vscode.Location[];
    assert.equal(definitions.length, 1);
    const def = definitions[0];
    assert.equal(def.uri.fsPath, docPath);  // in the same document
    const {start, end} = def.range;
    // Should start and end on line 6
    assert.equal(start.line, 6);
    assert.equal(end.line, 6);
    // export class AppComponent  { name = 'Angular'; }
    //                              =================
    assert.equal(start.character, 29);
    assert.equal(end.character, start.character + `name = 'Angular';`.length);
  });
});

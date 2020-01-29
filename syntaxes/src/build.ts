/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';

import {GrammarDefinition, JsonObject} from './types';
import {template} from './template/grammar';
import {InlineTemplate} from './inline-template';
import {InlineStyles} from './inline-styles';

// Recursively transforms a TypeScript grammar definition into an object which can be processed by
// JSON.stringify to generate a valid TextMate JSON grammar definition
function processGrammar(grammar: GrammarDefinition): JsonObject {
  const processedGrammar: JsonObject = {};
  for (const [key, value] of Object.entries(grammar)) {
    if (typeof value === 'string') {
      processedGrammar[key] = value;
    } else if (value instanceof RegExp) {
      // Escape backslashes/quote marks and trim the demarcating `/` characters from a regex literal
      processedGrammar[key] = value.toString().replace(/^\/|\/$/g, '');
    } else if (value instanceof Array) {
      processedGrammar[key] = value.map(processGrammar);
    } else {
      processedGrammar[key] = processGrammar(value);
    }
  }
  return processedGrammar;
}

// Build a TextMate grammar JSON file from a source TypeScript object
function build(grammar: GrammarDefinition, filename: string): void {
  const processedGrammar: JsonObject = processGrammar(grammar);
  const grammarContent: string = JSON.stringify(processedGrammar, null, '  ') + '\n';

  fs.writeFile(`syntaxes/out/${filename}.json`, grammarContent, (error) => {
    if (error) throw error;
  });
}

build(template, 'template');
build(InlineTemplate, 'inline-template');
build(InlineStyles, 'inline-styles');

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';

import {GrammarDefinition, JsonObject} from './types';

import {template} from './template';

const transformValue = (value: string|RegExp|GrammarDefinition|GrammarDefinition[]): string|
    JsonObject|JsonObject[] => {
      if (typeof value === 'string') {
        return value;
      } else if (value instanceof RegExp) {
        return value.toString().replace(/^\/|\/$/g, '');
      } else if (value instanceof Array) {
        return value.map(processGrammar);
      }
      return processGrammar(value);
    };

const processGrammar = (grammar: GrammarDefinition): JsonObject => {
  const processedGrammar: JsonObject = {};
  for (const [key, value] of Object.entries(grammar)) {
    processedGrammar[key] = transformValue(value);
  }

  return processedGrammar;
};

const build = (grammar: GrammarDefinition, filename: string): void => {
  const processedGrammar: JsonObject = processGrammar(grammar);
  const grammarContent: string = JSON.stringify(processedGrammar, null, '  ') + '\n';

  fs.writeFile(`syntaxes/${filename}.json`, grammarContent, (error) => {
    if (error) throw error;
  });
};

build(template, 'template');

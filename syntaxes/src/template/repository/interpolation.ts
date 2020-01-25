/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GrammarDefinition} from '../../types';

export const interpolation: GrammarDefinition = {
  begin: /{{/,
  beginCaptures: {
    0: {name: 'punctuation.definition.block.ts'},
  },
  end: /}}/,
  endCaptures: {
    0: {name: 'punctuation.definition.block.ts'},
  },
  contentName: 'source.js',
  patterns: [
    {include: 'source.js'},
  ],
};
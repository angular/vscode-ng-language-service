/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GrammarDefinition} from './types';

export const TemplateBlocks: GrammarDefinition = {
  scopeName: 'template.blocks.ng',
  injectionSelector: 'L:text.html -comment -expression.ng -meta.tag',
  patterns: [
    {include: '#block'},
  ],
  repository: {

    transition: {
      match: '@',
      name: 'keyword.control.block.transition.ng',
    },

    block: {
      begin: /(@)((?:\w+\s*)+)/,
      beginCaptures: {
        1: {
          patterns: [
            {include: '#transition'},
          ]
        },
        2: {name: 'keyword.control.block.kind.ng'},
      },
      patterns: [{include: '#blockExpression'}],
      end: '(?<=\\})',
      contentName: 'control.block.ng',
    },

    blockExpression: {
      begin: /(?:(\()(.*)(\)))?\s*/,
      beginCaptures: {
        1: {name: 'meta.brace.round.ts'},
        2: {
          name: 'control.block.expression.ng',
          patterns: [
            {include: 'source.js'},
          ]
        },
        3: {name: 'meta.brace.round.ts'},
      },
      end: '(?<=\\})',
      patterns: [{include: '#blockBody'}]
    },

    blockBody: {
      begin: /\{/,
      beginCaptures: {
        0: {name: 'punctuation.definition.block.ts'},
      },
      end: /\}/,
      endCaptures: {
        0: {name: 'punctuation.definition.block.ts'},
      },
      contentName: 'control.block.body.ng',
      patterns: [
        {include: 'text.html.derivative'},
        {include: 'template.ng'},
      ]
    },

  },
};

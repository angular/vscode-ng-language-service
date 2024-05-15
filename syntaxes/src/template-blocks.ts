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
  injectionSelector: 'L:text.html -comment -expression.ng -meta.tag -source.css -source.js',
  patterns: [
    {include: '#block'},
  ],
  repository: {

    transition: {
      match: '@',
      name: 'keyword.control.block.transition.ng',
    },

    block: {
      begin:
          /(@)(if|else if|else|defer|placeholder|loading|error|switch|case|default|for|empty)(?:\s*)/,
      beginCaptures: {
        1: {
          patterns: [
            {include: '#transition'},
          ]
        },
        2: {name: 'keyword.control.block.kind.ng'},
      },
      patterns: [{include: '#blockExpression'}, {include: '#blockBody'}],
      contentName: 'control.block.ng',
      // The block ends at the close `}` but we don't capture it here because. It's captured instead
      // by the #blockBody.
      end: /(?<=\})/,
    },

    blockExpression: {
      begin: /\(/,
      beginCaptures: {
        0: {name: 'meta.brace.round.ts'},
      },
      contentName: 'control.block.expression.ng',
      patterns: [{include: 'expression.ng'}],
      end: /\)/,
      endCaptures: {
        0: {name: 'meta.brace.round.ts'},
      },
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

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GrammarDefinition} from './types';

export const InlineTemplate: GrammarDefinition = {
  scopeName: 'inline-template.ng',
  injectionSelector: 'L:meta.decorator.ts -comment -text.html',
  patterns: [{include: '#inlineTemplate'}],
  repository: {
    inlineTemplate: {
      begin: /(template)\s*(:)/,
      beginCaptures: {
        1: {name: 'meta.object-literal.key.ts'},
        2: {name: 'meta.object-literal.key.ts punctuation.separator.key-value.ts'}
      },
      end: /(?=,|})/,
      patterns: [{include: '#tsParenExpression'}, {include: '#ngTemplate'}]
    },

    tsParenExpression: {
      begin: /\G\s*(\()/,
      beginCaptures: {1: {name: 'meta.brace.round.ts'}},
      end: /\)/,
      endCaptures: {0: {name: 'meta.brace.round.ts'}},
      patterns: [{include: '#tsParenExpression'}, {include: '#ngTemplate'}]
    },

    ngTemplate: {
      begin: /\G\s*([`|'|"])/,
      beginCaptures: {1: {name: 'string'}},
      // @ts-ignore
      end: /\1/,
      endCaptures: {0: {name: 'string'}},
      contentName: 'text.html.derivative',
      patterns: [
        {include: 'text.html.derivative'}, {include: 'template.ng'},
        {include: 'template.blocks.ng'}, {include: 'template.let.ng'},
        // note: template.tag.ng isn't used here and needs to be directly injected into source.ts
        // scopes at the top level because it relies entirely on the injectionSelector to filter its
        // matching out of non-html tag contexts. Since we don't have any scopes that match HTML
        // tags, we rely entirely on the text.html.derivative pattern matching and apply the tag
        // scope via injectionSelector only rather than being able to include it in a pattern list
        // of another match.
      ]
    }
  }
};

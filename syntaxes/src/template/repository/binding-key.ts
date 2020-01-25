/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GrammarDefinition} from '../../types';

export const bindingKey: GrammarDefinition = {
  patterns: [
    {
      match: /([\[\(]{1,2})(?:\s*)(@?[-_a-zA-Z0-9.$]*)(?:\s*)([\]\)]{1,2})/,
      captures: {
        1: {name: 'punctuation.definition.ng-binding-name.begin.html'},
        2: {
          patterns: [
            {
              match: /\./,
              name: 'punctuation.accessor.html',
            },
          ],
        },
        3: {name: 'punctuation.definition.ng-binding-name.end.html'},
      },
    },
  ],
};

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GrammarDefinition} from '../types';

import {bindingKey} from './repository/binding-key';
import {eventBinding} from './repository/event-binding';
import {interpolation} from './repository/interpolation';
import {propertyBinding} from './repository/property-binding';
import {templateBinding} from './repository/template-binding';
import {twoWayBinding} from './repository/two-way-binding';

export const template: GrammarDefinition = {
  scopeName: 'template.ng',
  injectionSelector: 'L:text.html -comment',
  patterns: [
    {include: '#interpolation'},
    {include: '#propertyBinding'},
    {include: '#eventBinding'},
    {include: '#twoWayBinding'},
    {include: '#templateBinding'},
  ],
  repository: {
    interpolation,
    propertyBinding,
    eventBinding,
    twoWayBinding,
    templateBinding,
    bindingKey,
  },
};

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export type GrammarDefinitionValue = string|RegExp|GrammarDefinition|GrammarDefinition[];

export interface GrammarDefinition {
  [key: string]: GrammarDefinitionValue;
}

export type JsonObjectValue = string|JsonObject|JsonObject[];

export interface JsonObject {
  [key: string]: JsonObjectValue;
}

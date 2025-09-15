import {FormatConfig} from '@angular/ng-dev';

/**
 * Configuration for the `ng-dev format` command.
 */
export const format: FormatConfig = {
  'prettier': {
    'matchers': [
      '**/*.{js,ts}',
    ],
  },
  'buildifier': true,
};

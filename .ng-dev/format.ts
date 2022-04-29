import {FormatConfig} from '@angular/dev-infra-private/ng-dev';

/**
 * Configuration for the `ng-dev format` command.
 */
export const format: FormatConfig = {
  'clang-format': {
    'matchers': [
      '**/*.{js,ts}',
    ],
  },
  'buildifier': true,
};

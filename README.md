# VS Code Plugin for the Angular Language Service

This plugin to VS Code provides Angular language services for Angular.

This plugin will provide completions in template files and template strings.

## Installation

To install the current experimental version, download the latest `ngls.vsix` file https://github.com/angular/vscode-ng-language-service/releases, then select "Install from VSIX" under the extensions menu to install it.

## Limitations

- The language service is a separate service from TypeScript and runs a duplicate
  version of the TypeScript language service.

See [#7482](https://github.com/angular/angular/issues/7482) for a more details
status of the current progress.

## Attribution

This project was adapted from the example language service client provided
by Microsoft for this purpose located here:

  [https://github.com/Microsoft/vscode-languageserver-node-example](https://github.com/Microsoft/vscode-languageserver-node-example)

This code is used under the MIT license.

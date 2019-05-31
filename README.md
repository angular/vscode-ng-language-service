# VS Code Plugin for the Angular Language Service

This plugin to VS Code provides Angular language services for Angular.

This plugin will provide completions in template files and template strings and
diagnostics for templates and Angular annotations.

Download the extension from [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).

## Limitations

- The language service is a separate service from TypeScript and runs a duplicate
  version of the TypeScript language service.

See [#7482](https://github.com/angular/angular/issues/7482) for a more details
status of the current progress.

## Using

Releases are at https://github.com/angular/vscode-ng-language-service/releases. Use 'install from VSIX' in VS Code editor extensions pane.

## Attribution

This project was adapted from the example language service client provided
by Microsoft for this purpose located here:

  [https://github.com/Microsoft/vscode-languageserver-node-example](https://github.com/Microsoft/vscode-languageserver-node-example)

This code is used under the MIT license.

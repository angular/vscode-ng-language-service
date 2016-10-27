# VS Code Plugin for the Angular Language Service

This plugin to VS Code provides Angular langauge services for Angular.

This plugin will provide completions in template files and template strings.

## Limitations

- The langauge service is a separate service from TypeScript and runs a duplicate
  version of the TypeScript language service.

- Only provide completions and diagnostic errors.

See [#7482](https://github.com/angular/angular/issues/7482) for a more details
status of the current progress.

## Attribution

This project was adapted from the example language service client provided
by Microsoft for this purpose located here:

  [https://github.com/Microsoft/vscode-languageserver-node-example](https://github.com/Microsoft/vscode-languageserver-node-example)

This code is used under the MIT license.
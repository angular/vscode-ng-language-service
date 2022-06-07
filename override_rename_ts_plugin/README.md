Note: This is currently disabled. See conversations in https://github.com/angular/vscode-ng-language-service/issues/1685 and https://github.com/angular/vscode-ng-language-service/issues/1683

This package is applied to the built-in TS extension by the config [`typescriptServerPlugins`][1] and is used to disable rename provider of the built-in TS extension so VSCode asks the Angular Language Service for the answer instead.

Detail about this package is [here][2].

[1]: https://code.visualstudio.com/api/references/contribution-points#contributes.typescriptServerPlugins
[2]: https://github.com/angular/angular/blob/main/packages/language-service/README.md#override-rename-ts-plugin

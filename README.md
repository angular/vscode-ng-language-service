# Angular Language Service

![demo](https://github.com/angular/vscode-ng-language-service/raw/master/demo.gif)

## Features

This extension provides a rich editing experience for Angular templates, both inline
and external templates including:

* Completions lists
* AOT Diagnostic messages
* Quick info
* Go to definition

## Download

Download the extension from [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).

## Versioning

The language service extension uses the `@angular/language-service` package for its backend. This
package is loaded either from the version bundled with the extension, or from the current workspace
project the extension is running on. Due to the behavior of TypeScript below version 3.8,
incompatible versions of the language service may sometimes be loaded. If you are using a version of
TypeScript below 3.8, we suggest either

- Not installing `@angular/language-service` in your project (recommended; will fallback on the
    version bundled with the extension)
- Installing and keeping updates for the latest version of `@angular/language-service`

For further information, please see [#594](https://github.com/angular/vscode-ng-language-service/issues/594).

## Installing a particular release build

Download the `.vsix` file for the release that you want to install from the [releases](https://github.com/angular/vscode-ng-language-service/releases) tab.

*Do not open the .vsix file directly*. Instead, in Visual Studio code, go to the extensions tab. Click on the "..." menu in the upper right corner of the extensions tab, select "Install from vsix..." and then select the .vsix file for the release you just downloaded.

The extension can also be installed with the following command:

```
code --install-extension /path/to/ngls.vsix
```

## Angular Language Service for Other Editors

- [coc-angular](https://github.com/iamcco/coc-angular) for (Neo)vim

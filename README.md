# Angular Language Service

![demo](https://github.com/angular/vscode-ng-language-service/raw/master/demo.gif)

## Features

This extension provides a rich editing experience for Angular templates, both inline
and external templates including:

* Completions lists
* AOT Diagnostic messages
* Quick info
* Go to definition

This extension uses `typescript@3.6.x`.

## Download

Download the extension from [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).


## Installing a particular release build

Download the `.vsix` file for the release that you want to install from the [releases](https://github.com/angular/vscode-ng-language-service/releases) tab.

*Do not open the .vsix file directly*. Instead, in Visual Studio code, go to the extensions tab. Click on the "..." menu in the upper right corner of the extensions tab, select "Install from vsix..." and then select the .vsix file for the release you just downloaded.

The extension can also be installed with the following command:
```
code --install-extension /path/to/ngls.vsix
```

## Angular Language Service for Other Editors

- [coc-angular](https://github.com/iamcco/coc-angular) for (Neo)vim

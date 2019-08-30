## Formatting source code

This repository uses the [NPM distribution](https://www.npmjs.com/package/clang-format) of
[`clang-format`](http://clang.llvm.org/docs/ClangFormat.html) to format source code.

Code is automatically formatted by running `yarn format`. You can also set up your IDE to format
files on each save.

### VS Code

1. Install the
[`Clang-Format` extension](https://marketplace.visualstudio.com/items?itemName=xaver.clang-format)
for VS Code.
2. Copy [`.vscode/recommended-settings.json`](./.vscode/recommended-settings.json) to a new
   `.vscode/settings.json` file. VS Code will automatically pick up relevant formatting options for
   the workspace from this file.

### WebStorm / IntelliJ

1. Install the [`ClangFormatIJ`](https://plugins.jetbrains.com/plugin/8396-clangformatij) plugin for
   IntelliJ IDEs.
2. Open `Preferences->Tools->clang-format`.
3. Set the field named "PATH" to `<PATH_TO_REPOSITORY>/node_modules/.bin/`.

### Vim

1. Install [Vim Clang-Format](https://github.com/rhysd/vim-clang-format).
2. Create a [project-specific `.vimrc`](https://andrew.stwrt.ca/posts/project-specific-vimrc/) in
   the repository root directory containing

```vim
let g:clang_format#command = '<PATH_TO_REPOSITORY>/node_modules/.bin/clang-format'
```

# Monorepo setup

This repository is a monorepo. All build outputs are created in the `bazel-bin` directory.

The `dependencies` in root [`package.json`](package.json) must include all production dependencies
of the client **and** and the server.

The dependencies of the `server` need to be duplicated in the root [`package.json`](package.json).
Therefore, if a new prod dependency is added to the server, it needs to be
added to both [`package.json`](package.json) and [`server/package.json`](server/package.json).

Note that we do not install the dependencies in [`server`](server),
hence there should not be a `yarn.lock` file.

## Navigating Projects in IDE

This repository contains multiple TypeScript projects, each with its own `tsconfig.json`.
TypeScript's [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) are used to handle the builds.
As a result, some projects depend on the `.d.ts` output of their dependencies, like `client`
and `server` depend on `common`. In order to navigate the projects in your IDE,
you need to first build them by running
```shell
yarn compile
```

If you'd like to force a clean build, you can delete the existing build artifacts
by running
```shell
./scripts/build.sh
```

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

## Test Local Changes in VSCode

Any changes made to the code in this repository or the upstream
`@angular/language-service` package can be immediately tested out in a
development version of VSCode. The instructions below explain how to bring up
a local instance and then install a local version of `@angular/language-service`.

### Check TypeScript version

First, make sure that the TypeScript version in `@angular/angular` is the same
as that used in this repository. If not, update the following files:

1. `typescript` dependency in [`package.json`](package.json)
2. `MIN_TS_VERSION` in [`version_provider.ts`](server/src/version_provider.ts)

### Launch VSCode in Extension Development Host

The scripts in `.vscode` directory are setup to automatically compile the code,
then launch a new instance of VSCode with the Angular extension installed.
To do so, either

1. Press F5, or
2. Go to Run on the sidebar, select `Launch Client` from the task list

After the client is launched, you can optionally choose to attach a debugger to
the local instance. To do so,

1. Go to Run on the sidebar, select `Attach to Server` from the task list

As a shortcut, there's also a task setup to automatically launch the client and
attach the debugger in a single step. To do so,

1. Go to Run on the sidebar, select `Client + Server` from the task list

Note: Because we are building with bazel, any breakpoints need to be set on the files in `bazel-bin/...` or by adding a `debugger;` statement before compilation.

### Install Local `@angular/language-service`

If changes are made to the upstream language service package, they can also be
tested locally. This involves building the NPM package, then updating the server
dependency. To do so, run the following script from the `@angular/angular`
repository.

```bash
./packages/language-service/build.sh /path/to/vscode-ng-language-service
```

# v11.2.8

- perf: prevent requests from being sent to the server when outside Angular context (fcbdf938e)
- build: Switch to esbuild instead of rollup for the client and banner (27ccba8d0)
- perf: check diagnostics in most recently used order (7f2873f6f56fbaff6c8232389ce64f3e60484a09)
- perf: Compute diagnostics for a single file if it is external template  (a2b77fa7680c8328c67f77e3765fc179702405c0)
- fix: logger should print one timestamp for an entire group (4d94f40d4c699916b379c9dab38a9e9e254e6c3e)

# v11.2.7

This release reverts the following commits due to [#1198](https://github.com/angular/vscode-ng-language-service/issues/1198):

- perf: prevent requests from being sent to the server when outside Angular context (fcbdf938e)
- build: Switch to esbuild instead of rollup for the client and banner (27ccba8d0)

# v11.2.6

This release upgrades `@angular/language-service` to v11.2.5.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1125-2021-03-10).

This release contains various performance improvements.

# v11.2.5

This release contains a few performance improvements.

Bug fixes:
- do not load plugins except @angular/language-service
- turn off logging by default
- do not watch directories in google3

# v11.2.4

This release upgrades `@angular/language-service` to v11.2.4.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1124-2021-03-03).

Bug fixes in `@angular/language-service`:
- Add plugin option to force strictTemplates (#41063) (95f748c)
- Always attempt HTML AST to template AST conversion for LS (#41068) (6dd5497), closes angular/vscode-ng-language-service#1140
- can't provide the Input and Output custom binding property name (#41005) (1b1b65e)
- don't show external template diagnostics in ts files (#41070) (9322e6a), closes #41032
- only provide template results on reference requests (#41041) (ef87953)
- provide element completions after open tag < (#41068) (f09e7ab), closes angular/vscode-ng-language-service#1140

Bug fixes in `@angular/language-server`:
- force enable Ivy and strictTemplates in google3
- detect @angular/core in google3 and don't run ngcc
- retain typecheck files after project reload
- do not pass execArgv to ngcc process
- attempt to resolve tsdk using fs path
- Revert back to boolean type for experimental-ivy flag
- remove TSC_NONPOLLING_WATCHER env variable
- ensure project language service is the Angular LS

# v11.2.3

This release upgrades `@angular/language-service` to v11.2.2.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1110-2021-01-20).

Performance improvements:
- The Ivy Language Service no longer slows down the operation of plain TS language service features when editing TS code outside of a template.

# v11.2.2

This release upgrades `@angular/language-service` to v11.2.1.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1200-next1-2021-02-17).

# v11.2.1

This release fixes a bug in the initialization of tsserver plugin that prevented
the Ivy-native language service from being loaded correctly.
See https://github.com/angular/vscode-ng-language-service/issues/1109

# v11.2.0

This release upgrades `@angular/language-service` to v11.2.0.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1120-2021-02-10).

Bug fixes:
- disable rename feature when strictTemplates is disabled
- implement realpath to resolve symlinks
- recognize incomplete pipe bindings with whitespace

Features:
- Prompt to use the Ivy Language Service if VE is detected
- Add Command to view template typecheck block
- Add diagnostics to suggest turning on strict mode

# v11.1.3

This release upgrades `@angular/language-service` to v11.1.2.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1112-2021-02-03).

# v11.1.2

No major updates in this release.

# v11.1.1

This release upgrades `@angular/language-service` to v11.1.1.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1111-2021-01-27).

# v11.1.0

Ivy-native language service is officially available for preview!
To try it, go to Preferences > Settings > Angular > check experimental-ivy.

This release upgrades `@angular/language-service` to v11.1.0.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1110-2021-01-20).

# 0.1101.0-rc.1

Bug fixes:
- update min TS and NG versions
- ngserver script could not find index.js

# v0.1101.0-rc.0

This release upgrades `@angular/language-service` to v11.1.0-rc.0.

For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1110-rc0-2021-01-13).

Bug fixes:
- prevent project from closing when only a template file is open

Features:
- enable tracing of LSP messages and payload

# v0.1101.0-next.2

This release upgrades `@angular/language-service` to v11.1.0-next.4.

For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1110-next4-2021-01-06).

# v0.1101.0-next.1

This release upgrades `@angular/language-service` to v11.1.0-next.3.

For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1110-next3-2020-12-16).

# v0.1101.0-next.0

This release upgrades `@angular/language-service` to v11.1.0-next.2.

For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1110-next2-2020-12-09).

Bug fixes:
- `require.resolve` not working in vscode, resulting in ngcc failure.
- Restart language server on configuration change.

# v0.1100.0

This release upgrades `@angular/language-service` to v11.0.0.

For a complete change log see [here](https://github.com/angular/angular/blob/11.0.x/CHANGELOG.md#1100-2020-11-11).

Bug fixes:
- LS not showing existing diagnotics on file open (#966)

# v0.1100.0-rc.1

This release upgrades `@angular/language-service` to v11.0.0-rc.3.

For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1100-rc3-2020-11-09).

# v0.1100.0-rc.0

This release upgrades `@angular/language-service` to v11.0.0-rc.1.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1100-rc1-2020-10-28).

# v0.1000.8

This release upgrades `@angular/language-service` to v10.0.14.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#10014-2020-08-26).

# v0.1000.7

This release upgrades `@angular/language-service` to v10.0.7.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1007-2020-07-30).

This release fixes a bug caused by the upgrade of bundle format from ES5 to
ES2015.

Bug fixes:
- Metadata should not include methods on Object.prototype (#38292) (879ff08)

# v0.1000.6

This release upgrades `@angular/language-service` to v10.0.6.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1006-2020-07-28).

# v0.1000.5

This release upgrades `@angular/language-service` to v10.0.5.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1005-2020-07-22).

The `.umd` suffix has been removed from the bundle filename.

# v0.1000.4

This release upgrades `@angular/language-service` to v10.0.4.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1004-2020-07-15).

Features:
- Upgrade bundle format to ES2015.

Bug fixes:
- Remove completion for string (#37983) (387e838)

# v0.1000.3

This release upgrades `@angular/language-service` to v10.0.3.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1003-2020-07-08).

Bug fixes:
- Do not match inline template grammars inside a template itself (#839)

# v0.1000.2

This release upgrades `@angular/language-service` to v10.0.2.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1002-2020-06-30).

Bug fixes:
- incorrect autocomplete results on unknown symbol (#37518) (7c0b25f)

# v0.1000.1

This release upgrades `@angular/language-service` to v10.0.1.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1001-2020-06-26).

This release fixes support for ["solution-style"](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#support-for-solution-style-tsconfigjson-files) tsconfig.

Bug fixes:
- reinstate getExternalFiles() (#37750) (ad6680f)

# v0.1000.0

This release upgrades `@angular/language-service` to v10.0.0 and `typescript` to v3.9.5.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1000-2020-06-24).

Known issues:
- This release does not yet support ["solution-style"](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#support-for-solution-style-tsconfigjson-files) tsconfig.
It is expected to be fixed in `v0.1000.1` release. Please follow [#824](https://github.com/angular/vscode-ng-language-service/issues/824) for updates.

Bug fixes:
- Improve signature selection by finding exact match (#37494) (e97a2d4)
- Recover from error in analyzing NgModules (#37108) (2c1f35e)
- Do not invalidate `@angular/core` module (#36783) (dd049ca)
- infer type of elements of array-like objects (#36312) (fe2b692), closes #36191
- properly evaluate types in comparable expressions (#36529) (8be0972)
- use empty statement as parent of type node (#36989) (a32cbed)
- use the HtmlAst to get the span of HTML tag (#36371) (81195a2)
- wrong completions in conditional operator (#37505) (32020f9)

Deprecations:
- Remove HTML entities autocompletion (#37515) (67bd88b)

# v0.1000.0-rc.1

This release upgrades `@angular/language-service` to v10.0.0-rc.2.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1000-rc2-2020-06-01).

# v0.1000.0-rc.0

This release upgrades `@angular/language-service` to v10.0.0-rc.0.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#1000-rc0-2020-05-21).

# v0.901.9

This release upgrades `@angular/language-service` to v9.1.9.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#919-2020-05-20).

# v0.901.8

This release upgrades `@angular/language-service` to v9.1.8.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#918-2020-05-20).

# v0.901.7

This release upgrades `@angular/language-service` to v9.1.7.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#917-2020-05-13).

# v0.901.6

This release upgrades `@angular/language-service` to v9.1.6.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#916-2020-05-08).

# v0.901.5

This release upgrades `@angular/language-service` to v9.1.5.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#915-2020-05-07).

# v0.901.4

This release upgrades `@angular/language-service` to v9.1.4.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#914-2020-04-29).

Bug fixes:
- do not invalidate `@angular/core` module (#36783) (d3a77ea)

# v0.901.3

This release upgrades `@angular/language-service` to v9.1.3.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#913-2020-04-22).

Bug fixes:
- properly evaluate types in comparable expressions (#36529) (5bab498)

# v0.901.2

This release upgrades `@angular/language-service` to v9.1.2.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#912-2020-04-15).

# v0.901.1

This release upgrades `@angular/language-service` to v9.1.1.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#911-2020-04-07).

Bug fixes:
- infer type of elements of array-like objects (#36312) (ff523c9), closes #36191
- use the HtmlAst to get the span of HTML tag (#36371) (ffa4e11)
- log message when language service is enabled for a project

# v0.901.0

This release upgrades `@angular/language-service` to v9.1.0.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#910-2020-03-25).

New features:
- improve non-callable error message (#35271) (acc483e)
- modularize error messages (#35678) (47a1811), closes #32663

Bug fixes:
- Catch failure to open script when language service is disabled (#699)
- Suggest ? and ! operator on nullable receiver (#35200) (3cc24a9)
- fix calculation of pipe spans (#35986) (406419b)
- get the right 'ElementAst' in the nested HTML tag (#35317) (8e354da)
- infer $implicit value for ngIf template contexts (#35941) (18b1bd4)
- infer context type of structural directives (#35537) (#35561) (54fd33f)
- provide completions for the structural directive that only injects the 'ViewContainerRef' (#35466) (66c06eb)
- provide hover for interpolation in attribute value (#35494) (049f118), closes PR#34847
- resolve the real path for symlink (#35895) (4e1d780)
- resolve the variable from the template context first (#35982) (3d46a45)

# v0.900.18

This release upgrades `@angular/language-service` to v9.0.7.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#907-2020-03-18).

Bug fixes:
- infer $implicit value for ngIf template contexts (#35941) (f5e4410)

# v0.900.17

This release upgrades `@angular/language-service` to v9.0.6.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#906-2020-03-10).

Bug fixes:
- resolve the variable from the template context first (#35982) (f882ff0)
- improve missing core.d.ts error message

# v0.900.16

This release upgrades `@angular/language-service` to v9.0.5.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#905-2020-03-04).

New features:
- modularize error messages (#35678) (bcff873)

Bug fixes:
- apply Angular template grammar syntax only to HTML derivative files

# v0.900.15

This release upgrades `@angular/language-service` to v9.0.4.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#904-2020-02-27).

Bug fixes:
- get the right 'ElementAst' in the nested HTML tag (#35317) (7403ba1)
- infer context type of structural directives (#35537) (#35561) (a491f7e)
- provide hover for interpolation in attribute value (#35494) (0700279)

# v0.900.14

This release introduces TextMate grammar for Angular template expressions.
Special thanks to @ghaschel, @ayazhafiz, and @dannymcgee.

# v0.900.13

This release upgrades `@angular/language-service` to v9.0.2.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#902-2020-02-19).

New features:
- Trigger autocomplete on pipe

Bug fixes:
- Editor buffer out of sync with file on disk

# v0.900.12

This release upgrades `@angular/language-service` to v9.0.1.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#901-2020-02-12).

Bug fixes:
- Suggest ? and ! operator on nullable receiver (#35200) (3cc24a9)

# v0.900.11

This release upgrades `@angular/language-service` to v9.0.0.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-2020-02-06).

# v0.900.10

This release upgrades `@angular/language-service` to v9.0.0-rc.14.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc14-2020-02-03).

# v0.900.9

This release upgrades `@angular/language-service` to v9.0.0-rc.13.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc13-2020-02-01).

Bug fixes:
- more accurate and specific binding scopes (#598)
- check that a language service exists for discovered projects (#562)

# v0.900.8

This release upgrades `@angular/language-service` to v9.0.0-rc.12.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc12-2020-01-30).

New features:
- completions for output $event properties in (#34570) (2a53727)
- provide completion for $event variable (#34570) (c246787)
- provide hover for microsyntax in structural directive (#34847) (baf4a63)

Bug fixes:
- prune duplicate returned definitions (#34995) (71f5417)
- remove repeated symbol definitions for structural directive (#34847) (35916d3)
- warn, not error, on missing context members (#35036) (0e76821)
- enable debug mode only when it is strictly turned on

# v0.900.7

This release upgrades `@angular/language-service` to v9.0.0-rc.11.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc11-2020-01-24).

New features:
- Specific suggestions for template context diags (#34751) (cc7fca4)
- Support multiple symbol definitions (#34782) (2f2396c)

Bug fixes:
- Diagnostic span should point to class name (#34932) (c9db7bd)

# v0.900.6

This release upgrades `@angular/language-service` to v9.0.0-rc.10.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc10-2020-01-22).

It also upgrades `vscode-languageclient` and `vscode-languageserver` to major
version 6.

New features:
- Completions support for template reference variables
- Provide completion for $event variable
- Support hover/definitions for structural directive
- Add grammar for template bindings

# v0.900.5

This release upgrades `@angular/language-service` to v9.0.0-rc.9.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc9-2020-01-15).

It also upgrades `typescript` to v3.7.4.

New features:
- Support hover/definitions for structural directive
- More detailed grammar scopes for template property binding syntax
- Textmate grammar for template event bindings
- Reenable probing language service and tsserver from active workspace
- Priortize workspace version when resolving ts and ng
- Add grammar for two-way bindings
- Trigger autocomplete on '$' character
- Upgrade `vscode-jsonrpc` to major version v5

Bug fixes:
- Language service works with HTML without TS files open
- Fix CRLF offset in inline template
- Do not use an i18n parser for templates
- Require min typescript v3.7

# v0.900.4

This release upgrades `@angular/language-service` to v9.0.0-rc.8.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc8-2020-01-08).

New features:
- Append symbol type to hover tooltip (#34515) (381b895)
- Show documentation on hover (#34506) (1660095)
- Add textmate grammar for template property bindings

Bug fixes:
- completions after "let x of |" in ngFor (#34473) (ca8b584)
- correctly parse expressions in an attribute (#34517) (7a0d6e7)
- pipe method should not include parentheses (#34485) (2845596)
- whitelist all html elements

# v0.900.3

This release upgrades `@angular/language-service` to v9.0.0-rc.7.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc7-2019-12-18).

New features:
- add textmate grammar for inline CSS styles
- add syntax highlighting grammar for interpolations

Bug fixes:
- reset loading status when the language service fails to load the project
- correctly specify embedded languages in an Angular template
- HTML path should include last node before cursor
- Proper completions for properties and events

# v0.900.2

This release upgrades `@angular/language-service` to v9.0.0-rc.6.
For a complete change log see [here](https://github.com/angular/angular/blob/master/CHANGELOG.md#900-rc6-2019-12-11).

Bug fixes:
- Fixed accessing a string index signature using dot notation
- Remove `getExternalFiles()`
- Fixed JS primitive type name
- Simplify resolution logic in banner

# v0.900.1

Bug fixes:
- Fixed crash when extension is loaded in VSCode Insiders
- Fixed error message `No metadata found for component`
- Fixed indexed type errors in template
- Fixed error message `Unknown method "bind"`
- Fixed type of exported values in `ngFor`
- Fixed error message `Component is not included in a module`

New features:
- Syntax highlighting for inline templates
- Method completions now include parentheses at the end

# v0.900.0
This release is a substantial overhaul of the Angular language service that brings
significant performance improvements.

New features:
- Added "go to definition" for `templateUrl` and `styleUrls`.
- Hover tooltip now shows the `NgModule` a directive is declared in.
- Added `angular.ngdk` config for specifying location of `@angular/language-service`.
- Added vscode command to restart the extension.
- Display loading indicator while project is loading.

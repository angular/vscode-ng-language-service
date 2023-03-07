# 15.2.0

This release upgrades `@angular/language-service` to v15.2.0.

* fix(server): Fall back to bundled TS version if specified TSDK is too old ([#1863](https://github.com/angular/vscode-ng-language-service/pull/1863))

# 15.2.0-next.0

This release upgrades `@angular/language-service` to v15.2.0-next.1.

* feat: Add option to disable code actions ([#1849](https://github.com/angular/vscode-ng-language-service/pull/1849))

# 15.1.0

This release upgrades `@angular/language-service` to v15.1.0.

* feat: Allow auto-imports to suggest multiple possible imports. ([#47955](https://github.com/angular/angular/pull/47955))

# 15.0.4

This release upgrades `@angular/language-service` to v15.0.4.

* perf(extension): Ensure Angular code actions are only retrieved in Angular contexts (#1842)

# 15.0.3

This release upgrades `@angular/language-service` to v15.0.3.

* fix(server): filter unsupported code action to improve performance on save (#1834)
* fix(compiler-cli): Produce diagnostic rather than crash when using invalid hostDirective ([#48314](https://github.com/angular/angular/pull/48314))

# 15.0.2

This release upgrades `@angular/language-service` to v15.0.2.

* fix(extension): Ensure older projects that require View Engine can function (#1826)

# 15.0.1

This release fixes an incorrectly bundled `vsix` in the v15.0.0 release.

# 15.0.0

This release upgrades `@angular/language-service` to v15.0.0.

* feat(server): provide folding ranges for inline templates (#1779)
* fix(server): resolve tsdk correctly when settings specify a relative location (#1765)
* fix(server): send diagnostic range to the Angular language service when fixing code errors (#1747)
* fix: support deeply nested pnpm virtual store node_modules paths in resolveAndRunNgcc (#1742)
* feat(server): support code actions (#1723)
* feat(language-service):	Quick fix to import a component when its selector is used ([#47088](https://github.com/angular/angular/pull/47088))
* feat(language-service):	support to fix invalid banana in box ([#47393](https://github.com/angular/angular/pull/47393))

# v14.2.0

This release upgrades `@angular/language-service` to v14.2.0.

* feat: support fix the component missing member (#46764)
* fix: support deeply nested pnpm virtual store node_modules paths in resolveAndRunNgcc (#1742) (511218f10)
* feat: support code action (#1723) (a5ecf2df6)

# v14.1.0

This release upgrades `@angular/language-service` to v14.1.0

* feat(extension): Update untrusted workspace support from 'false' to 'limited' (#1695) (7d904ca20)
* feat(extension): Update virtualWorkspace support to allow syntax highlighting (#1694) (f8b0db869)

# v14.0.1

* fix(extension): disable rename override to allow built in TS renaming (#1687)

# v14.0.0

This release upgrades `@angular/language-service` to v14.0.0

* feat: Add option to disable ngcc (#1620)
* feat(extension): Support renaming from TypeScript files (#1589)
* feat(extension): Add option to force strict templates (#1646) (17fdb9ec6)
* feat: add command to run ngcc manually (#1621) (dd0e0009b)
* Fix detection of Angular for v14+ projects ([#45998](https://github.com/angular/angular/pull/45998)) 
* Prevent TSServer from removing templates from project ([#45965](https://github.com/angular/angular/pull/45965)) 

# v13.3.4

This release upgrades `@angular/language-service` to v13.3.8.

| Commit | Type | Description |
| -- | -- | -- |
| [b4eb9ed884](https://github.com/angular/angular/commit/b4eb9ed884a82ba741abb503c974df7ec0d0048a) | fix | Prevent TSServer from removing templates from project ([#45965](https://github.com/angular/angular/pull/45965)) |

# v13.2.3

This release upgrades `@angular/language-service` to v13.2.2.

* build(server): Update node version to match angular/angular (including v16) (#1612) (8d2420f11)

# v13.2.2

This release upgrades `@angular/language-service` to v13.2.1.

* fix(server): return the right range for the original source file of DTS (#1604) (2caa6cf23)


# v13.2.1

Skipped due to release process mistake.

# v13.2.0

This release upgrades `@angular/language-service` to v13.2.0.

* feat(server): Definitions for sources compiled with `declarationMap` go to
  original source


# v13.1.0

This release upgrades `@angular/language-service` to v13.1.0.

* fix: Correctly parse inputs and selectors with dollar signs (#44268)

# v13.0.0

This release upgrades `@angular/language-service` to v13.0.0.
For a complete change log see
[here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1300-2021-11-03).

1. feat: provide snippets for attribute (#1509) (0428c31fa)
1. feat: Add support for going to template from component  (#1491) (3014713e1)
1. feat(server): add related information to diagnostics (#1492) (04b215b09)
1. feat: add config to enable auto-apply optional chaining on nullable symbol (#1469) (4fcbdb74a)

# v12.2.3

This release upgrades `@angular/language-service` to v12.2.12.

This release contains various internal refactorings and dependency updates.

# v12.2.2

This release upgrades `@angular/language-service` to v12.2.10.

* support resolving ngcc from APF v13 output (#1523) (f8aa9927c)

# v12.2.1

This release upgrades `@angular/language-service` to v12.2.9.

This release contains various internal refactorings and dependency updates.

# v12.2.0

This release upgrades `@angular/language-service` to v12.2.0.
For a complete change log see
[here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1220-2021-08-04).

1. fix(language-service): provide literal completions as well as context completions (https://github.com/angular/angular/pull/42729)


# v12.1.4

This release upgrades `@angular/language-service` to v12.1.4.
For a complete change log see
[here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1214-2021-07-28).

1. fix(language-server): rename response should use URI instead of file name (#1462) (49d81aa4a)
1. fix(language-server): Only enable language service on open projects (#1461) (26f6fcf1b)
1. fix: unchanged files sometimes have no Angular information for string… (#1453) (9ca675a3a)

# v12.1.3

This release upgrades `@angular/language-service` to v12.1.3.
For a complete change log see
[here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1213-2021-07-21).

1. fix(server): Only provide InsertReplaceEdit when the client supports it (#1452) (7c22c4c3a)

# v12.1.2

This release upgrades `@angular/language-service` to v12.1.2.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1212-2021-07-14).

1. fix(language-server): Ensure LS is enabled in same order as project initialization for solution-style projects (#1447) (68ee8344e)
1. fix(compiler-cli): return directives for an element on a microsyntax template (https://github.com/angular/angular/pull/42640)

# v12.1.1

This release upgrades `@angular/language-service` to v12.1.1.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1211-2021-06-30).

* update to TS 4.3.4 (#1428) (fb6681ee6)

# v12.1.0


This release upgrades `@angular/language-service` to v12.1.0.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1210-2021-06-24).

Features:
1. feat: Allow renaming from string literals in TS files (#1337) (9dba839b3)

# v12.0.5

Bug fixes:

1. fix(completions): fix completions for inputs / outputs (#1405) (d602cf933)
2. fix(language-service): fix autocomplete info display for attributes (https://github.com/angular/angular/pull/42472)


# v12.0.4

This release upgrades `@angular/language-service` to v12.0.3.

Bug fixes:
1. compiler-cli: better detect classes that are indirectly exported (#42207)

# v12.0.3
This release upgrades `@angular/language-service` to v12.0.2.

* fix: support nullish coalesce for syntax highlighting  (#1376) (fa8a98678)

# v12.0.2

* fix: only give html provider completions for inline templates (#1369) (98d5c97bb)
* fix: avoid showing MISSING: command for code lens in templates (#1370) (fa5212faf)
* perf: Avoid making Angular-related decisions for files not in an Angular project (#1360) (f83b02eb0)
* fix: remove angular.ngdk configuration (#1361) (797140c2b)
* fix: remove message about disabled LS if ngcc fails (#1359) (0fdc5fb20)

# v12.0.1

This release fixes a bug where View Engine is not launched for older projects
even though the Angular version is resolved correctly.
This is because the configuration value is typed as `boolean`, and defaults to
`false` even when the value is not set. (d6cb5cb5ad)


# v12.0.0

This release upgrades `@angular/language-service` to v12.0.0.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1200-2021-05-12).

New features:
1. add support for signature help (#1277) (ec148073f)
1. forward completion and hover requests to html providers for inline templates (72ee5c71c)
1. Allow users to hide strictTemplates prompt (bd612107a)
1. Add codelens with a link to go to the component from a template (76e234281)
1. add command to go to component(s) from external template (d1ca20a14)
1. update typescript to v4.2.3 (730ce54bf)

Bug fixes:
1. fix: files incorrectly determined as not being in an Angular project (#1331) (43bcbb732)
1. remove TSC_NONPOLLING_WATCHER env variable and provide default watchOptions (#1323) (6eb2984cb)
1. Use View Engine LS for projects < v9 (7ff10b898)
1. Use View Engine LS for projects < v9 (2585e0310)
1. set minimum TS version to 4.2 (ea3a73900)
1. pass watch options to watchFile and watchDirectory (bae335dc4)
1. make Ivy LS the default (c23612f9b)
1. do not resolve CodeLens command until LS is enabled (#1260) (93b47487a)
1. dispose reporters and notification handlers when client is stopped (aa8ac6eb9)
1. only restart language server on angular configuration change (fb5f89590)
1. do not minify the client code (1068ef40a)
1. logger should print one timestamp for an entire group (f3930c1dc)
1. do not load plugins except @angular/language-service (0901addfd)
1. turn off logging by default (f5925ff26)
1. do not watch directories in google3 (6a8a2d9b2)
1. force enable Ivy and strictTemplates in google3 (9182c4cc5)
1. use single entry point for @angular/language-service (93c541f2e)
1. detect @angular/core in google3 and don't run ngcc (ea1a7de77)
1. retain typecheck files after project reload (bc9d9fc78)
1. do not pass execArgv to ngcc process (460ef30f2)
1. show Go to component in HTML files only (d4e70c641)
1. attempt to resolve tsdk using fs path (7a8cb6084)
1. Revert back to boolean type for experimental-ivy flag (c1daa2cc0)
1. remove TSC_NONPOLLING_WATCHER env variable (17708d44c)
1. ensure project language service is the Angular LS (dfedf3cbb)
1. unable to load ivy native plugin (b08b295b2)

Performance improvements:
1. Avoid making Angular-related decisions for files not in an Angular project (#1259) (d8666d835)
1. check diagnostics in most recently used order (dcd32294a)
1. Compute diagnostics for a single file if it is external template (237d3f6df)
1. prevent requests from being sent to the sesrver when outside Angular context (5c3eda19d)
1. yield after checking diagnostics for an open file (d4ab1a21e)
1. Support request cancellation (af0b5a46c)

# v11.2.14

Bug fixes:
1. files incorrectly determined as not being in an Angular project (#1331) (d26daaaa5)
2. remove TSC_NONPOLLING_WATCHER env variable and provide default watchOptions (#1323) (#1326) (bbd0c60fa)

# v11.2.13
This release upgrades `@angular/language-service` to v11.2.12.

Bug fixes:
1. High CPU usage when idle due to file watching (#1317) (06f1add66)

# v11.2.12
This release upgrades `@angular/language-service` to v11.2.11.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#11211-2021-04-21).

Bug fixes:
1. compiler-cli: autocomplete literal types in templates (296f887)


# v11.2.11

This release upgrades `@angular/language-service` to v11.2.10.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#11210-2021-04-14).

Bug fixes:
1. language-service: bound attributes should not break directive matching (#41597) (3dbcc7f)
1. language-service: resolve to the pre-compiled style when compiled css url is provided (#41538) (3d54980)
1. language-service: use 'any' instead of failing for inline TCBs (#41513) (f76873e)

Performance improvements:
1. Avoid making Angular-related decisions for files not in an Angular project
(#1259) (154cf5efa)

# v11.2.10

This release upgrades `@angular/language-service` to v11.2.9.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1129-2021-04-07).

Bug fixes:
1. Allow analysis to continue with invalid style url (#41403) (#41489) (07131fa)
1. Dispose reporters and notification handlers when client is stopped (ef5297de7)
1. Only restart language server on angular configuration change (ba99ed814)

Performance improvements:
1. Add perf tracing to LanguageService (#41401) (7b0a800)

# v11.2.9
This release upgrades `@angular/language-service` to v11.2.7.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1127-2021-03-24).

bug fixes in `@angular/language-service`:
* **compiler-cli:** add `useInlining` option to type check config ([#41268](https://github.com/angular/angular/issues/41268)) ([57644e9](https://github.com/angular/angular/commit/57644e95aadbfe9c8f336be77a22f7a5e1859758)), closes [#40963](https://github.com/angular/angular/issues/40963)
* **language-service:** show suggestion when type inference is suboptimal ([#41072](https://github.com/angular/angular/issues/41072)) ([18cd7a0](https://github.com/angular/angular/commit/18cd7a0c6921983556fe1fffbff93d42ae138007)), closes [angular/vscode-ng-language-service#1155](https://github.com/angular/vscode-ng-language-service/issues/1155) [#41042](https://github.com/angular/angular/issues/41042)

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1125-2021-03-10).

This release contains various performance improvements.

# v11.2.5

This release contains a few performance improvements.

Bug fixes:
- do not load plugins except @angular/language-service
- turn off logging by default
- do not watch directories in google3

# v11.2.4

This release upgrades `@angular/language-service` to v11.2.4.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1124-2021-03-03).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1110-2021-01-20).

Performance improvements:
- The Ivy Language Service no longer slows down the operation of plain TS language service features when editing TS code outside of a template.

# v11.2.2

This release upgrades `@angular/language-service` to v11.2.1.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1200-next1-2021-02-17).

# v11.2.1

This release fixes a bug in the initialization of tsserver plugin that prevented
the Ivy-native language service from being loaded correctly.
See https://github.com/angular/vscode-ng-language-service/issues/1109

# v11.2.0

This release upgrades `@angular/language-service` to v11.2.0.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1120-2021-02-10).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1112-2021-02-03).

# v11.1.2

No major updates in this release.

# v11.1.1

This release upgrades `@angular/language-service` to v11.1.1.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1111-2021-01-27).

# v11.1.0

Ivy-native language service is officially available for preview!
To try it, go to Preferences > Settings > Angular > check experimental-ivy.

This release upgrades `@angular/language-service` to v11.1.0.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1110-2021-01-20).

# 0.1101.0-rc.1

Bug fixes:
- update min TS and NG versions
- ngserver script could not find index.js

# v0.1101.0-rc.0

This release upgrades `@angular/language-service` to v11.1.0-rc.0.

For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1110-rc0-2021-01-13).

Bug fixes:
- prevent project from closing when only a template file is open

Features:
- enable tracing of LSP messages and payload

# v0.1101.0-next.2

This release upgrades `@angular/language-service` to v11.1.0-next.4.

For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1110-next4-2021-01-06).

# v0.1101.0-next.1

This release upgrades `@angular/language-service` to v11.1.0-next.3.

For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1110-next3-2020-12-16).

# v0.1101.0-next.0

This release upgrades `@angular/language-service` to v11.1.0-next.2.

For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1110-next2-2020-12-09).

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

For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1100-rc3-2020-11-09).

# v0.1100.0-rc.0

This release upgrades `@angular/language-service` to v11.0.0-rc.1.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1100-rc1-2020-10-28).

# v0.1000.8

This release upgrades `@angular/language-service` to v10.0.14.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#10014-2020-08-26).

# v0.1000.7

This release upgrades `@angular/language-service` to v10.0.7.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1007-2020-07-30).

This release fixes a bug caused by the upgrade of bundle format from ES5 to
ES2015.

Bug fixes:
- Metadata should not include methods on Object.prototype (#38292) (879ff08)

# v0.1000.6

This release upgrades `@angular/language-service` to v10.0.6.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1006-2020-07-28).

# v0.1000.5

This release upgrades `@angular/language-service` to v10.0.5.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1005-2020-07-22).

The `.umd` suffix has been removed from the bundle filename.

# v0.1000.4

This release upgrades `@angular/language-service` to v10.0.4.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1004-2020-07-15).

Features:
- Upgrade bundle format to ES2015.

Bug fixes:
- Remove completion for string (#37983) (387e838)

# v0.1000.3

This release upgrades `@angular/language-service` to v10.0.3.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1003-2020-07-08).

Bug fixes:
- Do not match inline template grammars inside a template itself (#839)

# v0.1000.2

This release upgrades `@angular/language-service` to v10.0.2.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1002-2020-06-30).

Bug fixes:
- incorrect autocomplete results on unknown symbol (#37518) (7c0b25f)

# v0.1000.1

This release upgrades `@angular/language-service` to v10.0.1.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1001-2020-06-26).

This release fixes support for ["solution-style"](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#support-for-solution-style-tsconfigjson-files) tsconfig.

Bug fixes:
- reinstate getExternalFiles() (#37750) (ad6680f)

# v0.1000.0

This release upgrades `@angular/language-service` to v10.0.0 and `typescript` to v3.9.5.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1000-2020-06-24).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1000-rc2-2020-06-01).

# v0.1000.0-rc.0

This release upgrades `@angular/language-service` to v10.0.0-rc.0.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#1000-rc0-2020-05-21).

# v0.901.9

This release upgrades `@angular/language-service` to v9.1.9.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#919-2020-05-20).

# v0.901.8

This release upgrades `@angular/language-service` to v9.1.8.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#918-2020-05-20).

# v0.901.7

This release upgrades `@angular/language-service` to v9.1.7.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#917-2020-05-13).

# v0.901.6

This release upgrades `@angular/language-service` to v9.1.6.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#916-2020-05-08).

# v0.901.5

This release upgrades `@angular/language-service` to v9.1.5.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#915-2020-05-07).

# v0.901.4

This release upgrades `@angular/language-service` to v9.1.4.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#914-2020-04-29).

Bug fixes:
- do not invalidate `@angular/core` module (#36783) (d3a77ea)

# v0.901.3

This release upgrades `@angular/language-service` to v9.1.3.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#913-2020-04-22).

Bug fixes:
- properly evaluate types in comparable expressions (#36529) (5bab498)

# v0.901.2

This release upgrades `@angular/language-service` to v9.1.2.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#912-2020-04-15).

# v0.901.1

This release upgrades `@angular/language-service` to v9.1.1.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#911-2020-04-07).

Bug fixes:
- infer type of elements of array-like objects (#36312) (ff523c9), closes #36191
- use the HtmlAst to get the span of HTML tag (#36371) (ffa4e11)
- log message when language service is enabled for a project

# v0.901.0

This release upgrades `@angular/language-service` to v9.1.0.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#910-2020-03-25).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#907-2020-03-18).

Bug fixes:
- infer $implicit value for ngIf template contexts (#35941) (f5e4410)

# v0.900.17

This release upgrades `@angular/language-service` to v9.0.6.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#906-2020-03-10).

Bug fixes:
- resolve the variable from the template context first (#35982) (f882ff0)
- improve missing core.d.ts error message

# v0.900.16

This release upgrades `@angular/language-service` to v9.0.5.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#905-2020-03-04).

New features:
- modularize error messages (#35678) (bcff873)

Bug fixes:
- apply Angular template grammar syntax only to HTML derivative files

# v0.900.15

This release upgrades `@angular/language-service` to v9.0.4.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#904-2020-02-27).

Bug fixes:
- get the right 'ElementAst' in the nested HTML tag (#35317) (7403ba1)
- infer context type of structural directives (#35537) (#35561) (a491f7e)
- provide hover for interpolation in attribute value (#35494) (0700279)

# v0.900.14

This release introduces TextMate grammar for Angular template expressions.
Special thanks to @ghaschel, @ayazhafiz, and @dannymcgee.

# v0.900.13

This release upgrades `@angular/language-service` to v9.0.2.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#902-2020-02-19).

New features:
- Trigger autocomplete on pipe

Bug fixes:
- Editor buffer out of sync with file on disk

# v0.900.12

This release upgrades `@angular/language-service` to v9.0.1.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#901-2020-02-12).

Bug fixes:
- Suggest ? and ! operator on nullable receiver (#35200) (3cc24a9)

# v0.900.11

This release upgrades `@angular/language-service` to v9.0.0.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-2020-02-06).

# v0.900.10

This release upgrades `@angular/language-service` to v9.0.0-rc.14.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc14-2020-02-03).

# v0.900.9

This release upgrades `@angular/language-service` to v9.0.0-rc.13.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc13-2020-02-01).

Bug fixes:
- more accurate and specific binding scopes (#598)
- check that a language service exists for discovered projects (#562)

# v0.900.8

This release upgrades `@angular/language-service` to v9.0.0-rc.12.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc12-2020-01-30).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc11-2020-01-24).

New features:
- Specific suggestions for template context diags (#34751) (cc7fca4)
- Support multiple symbol definitions (#34782) (2f2396c)

Bug fixes:
- Diagnostic span should point to class name (#34932) (c9db7bd)

# v0.900.6

This release upgrades `@angular/language-service` to v9.0.0-rc.10.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc10-2020-01-22).

It also upgrades `vscode-languageclient` and `vscode-languageserver` to major
version 6.

New features:
- Completions support for template reference variables
- Provide completion for $event variable
- Support hover/definitions for structural directive
- Add grammar for template bindings

# v0.900.5

This release upgrades `@angular/language-service` to v9.0.0-rc.9.
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc9-2020-01-15).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc8-2020-01-08).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc7-2019-12-18).

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
For a complete change log see [here](https://github.com/angular/angular/blob/main/CHANGELOG.md#900-rc6-2019-12-11).

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

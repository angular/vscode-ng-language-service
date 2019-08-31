import * as testRunner from 'vscode/lib/testrunner';

// This is the entry point of the test.
// The test runner provided by vscode uses Mocha.
// Check output in `Debug Console` of the main vscode window.
testRunner.configure({ui: 'bdd', useColors: true, timeout: 100000});

module.exports = testRunner;

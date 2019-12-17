#!/usr/bin/env node
// Usage:
//   yarn test:syntax [-u]
//
// Arguments:
//   -u update snapshot files

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const syntaxesTestDir = 'syntaxes/test';
const DUMMY_GRAMMARS = fs.readdirSync(syntaxesTestDir)
                           .filter(file => /.*-dummy\.json$/.test(file))
                           .map(file => path.join(syntaxesTestDir, file));

const SNAPSHOT_TEST_CASES = [
  {
    scopeName: 'inline-template.ng',
    grammarFiles: ['syntaxes/inline-template.json', ...DUMMY_GRAMMARS],
    testFile: 'syntaxes/test/inline-template.ts'
  },
];

/** Wraps node's spawn in a Promise. */
function spawn(...args) {
  const child = cp.spawn(...args);

  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0)
        resolve(0);
      else
        reject(code);
    });
  });
}

async function snapshotTest(scopeName, grammarFiles, testFile) {
  const grammarOptions = grammarFiles.reduce((acc, file) => [...acc, '-g', file], []);
  const extraArgs = process.argv.slice(2);
  const options =
      ['vscode-tmgrammar-snap', '-s', scopeName, ...grammarOptions, '-t', testFile, ...extraArgs];

  const result = await spawn('yarn', options, {stdio: 'inherit' /* use parent process IO */})
                     .catch(process.exit);
}

async function main() {
  for (let {scopeName, grammarFiles, testFile} of SNAPSHOT_TEST_CASES) {
    if (!scopeName || !grammarFiles || !testFile) {
      console.error(
          `Test specified incorrectly; must include scopeName, grammarFiles, and testFile properties.`);
      process.exit(1);
    }

    await snapshotTest(scopeName, grammarFiles, testFile);
  }

  console.log('All tests passed!');
}

main();

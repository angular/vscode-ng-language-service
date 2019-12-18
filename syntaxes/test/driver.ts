#!/usr/bin/env node
// Usage:
//   yarn test:syntaxes [options]
//
// Options:
//   -u    update snapshot files (always passes)

import 'jasmine';

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as SNAPSHOT_TEST_CASES from './cases.json';

interface TestCase {
  name: string;
  scopeName: string;
  grammarFiles: string[];
  testFile: string;
}

const dummyGrammarDir = path.join(__dirname, 'dummy');
const DUMMY_GRAMMARS =
    fs.readdirSync(dummyGrammarDir).map((file: string) => path.join(dummyGrammarDir, file));

/** Wraps node's spawn in a Promise. */
function spawn(...args: Parameters<typeof cp.spawn>): Promise<number> {
  const child = cp.spawn(...args);

  return new Promise((resolve, reject) => {
    child.on('exit', (code: number) => {
      if (code === 0)
        resolve(0);
      else
        reject(code);
    });
  });
}

async function snapshotTest({scopeName, grammarFiles, testFile}: TestCase): Promise<number> {
  grammarFiles.push(...DUMMY_GRAMMARS);
  const grammarOptions = grammarFiles.reduce((acc, file) => [...acc, '-g', file], [] as string[]);
  const extraArgs = process.argv.slice(3);
  const options =
      ['vscode-tmgrammar-snap', '-s', scopeName, ...grammarOptions, '-t', testFile, ...extraArgs];

  return spawn('yarn', options, {stdio: 'inherit' /* use parent process IO */}).catch(code => code);
}

describe('snapshot tests', async () => {
  for (let tc of SNAPSHOT_TEST_CASES) {
    it(`should work for ${tc.name}`, async () => {
      const ec = await snapshotTest(tc);
      expect(ec).toBe(0);
    });
  }
});

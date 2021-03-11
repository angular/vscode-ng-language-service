import * as fs from 'fs';
import commonjs from 'rollup-plugin-commonjs';

module.exports = [
  {
    input: 'dist/client/extension.js',
    output: {
      file: 'dist/npm/index.js',
      format: 'cjs',
      exports: 'named',
    },
    external: [
      'path',
      'vscode',
      'vscode-languageclient',
    ],
    plugins: [
      commonjs(),
    ],
  },
  {
    input: 'dist/server/server.js',
    output: {
      file: 'dist/npm/server/index.js',
      format: 'amd',
      banner: fs.readFileSync('dist/banner/banner.rollup.js', 'utf8'),
    },
    external: [
      'fs',
      'path',
      'typescript/lib/tsserverlibrary',
      'vscode-languageserver',
      'vscode-uri',
    ],
    plugins: [
      commonjs({
        ignore: [
          // leave require statements unconverted.
          'conditional-runtime-dependency',
        ],
      }),
    ],
  },
];

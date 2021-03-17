import commonjs from '@rollup/plugin-commonjs';
import * as fs from 'fs';

module.exports = [
  {
    input: 'dist/server/server.js',
    output: {
      file: 'dist/npm/server/index.js',
      format: 'amd',
      banner: fs.readFileSync('dist/banner/banner.esbuild.js', 'utf8'),
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
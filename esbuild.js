const esbuild = require('esbuild');
const fs = require('fs');

/** @type esbuild.BuildOptions */
const defaultOptions = {
  bundle: true,
  platform: 'node',
  logLevel: 'info',
  format: 'cjs',
};

/** @type esbuild.BuildOptions */
const clientConfig = {
  ...defaultOptions,
  entryPoints: ['dist/client/src/extension.js'],
  outfile: 'dist/npm/index.js',
  external: [
    'fs',
    'path',
    'vscode',
    'vscode-languageclient/node',
    'vscode-languageserver-protocol',
    'vscode-jsonrpc',
  ],
  // Do not enable minification. It seems to break the extension on Windows (with WSL). See #1198.
  minify: false,
};

/** @type esbuild.BuildOptions */
const bannerConfig = {
  ...defaultOptions,
  entryPoints: ['dist/server/src/banner.js'],
  outfile: 'dist/server/src/banner.esbuild.js',
  external: [
    'path',
  ],
  // This is described in more detail in the `server/banner.ts` but this line actually overrides
  // the built-in `require` function by adding a line at the bottom of the generated banner code
  // to assign the override function to the `require` name.
  footer: {js: 'require = requireOverride;'}
};

/** @type esbuild.BuildOptions */
const serverConfig = {
  ...defaultOptions,
  entryPoints: ['dist/server/src/server.js'],
  outfile: 'dist/npm/server/index.js',
  external: [
    'fs',
    'path',
    'typescript/lib/tsserverlibrary',
    'vscode-languageserver',
    'vscode-uri',
    'vscode-jsonrpc',
  ],
};

async function build() {
  try {
    await esbuild.build(clientConfig);
    await esbuild.build(bannerConfig);
    await esbuild.build({
      ...serverConfig,
      banner: {js: fs.readFileSync('dist/server/src/banner.esbuild.js', 'utf8')},
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

build();
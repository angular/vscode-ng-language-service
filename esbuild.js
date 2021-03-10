const esbuild = require('esbuild');
const fs = require('fs');

const defaultOptions = {
  bundle: true,
  platform: 'node',
  logLevel: 'info',
};

/** @type esbuild.BuildOptions */
const clientConfig = {
  ...defaultOptions,
  entryPoints: ['dist/client/extension.js'],
  outfile: 'dist/npm/index.js',
  external: [
    'fs',
    'path',
    'vscode',
    'vscode-languageclient/node',
    'vscode-languageserver-protocol',
    'vscode-jsonrpc',
  ],
  format: 'cjs',
  minify: true,
};

/** @type esbuild.BuildOptions */
const bannerConfig = {
  ...defaultOptions,
  entryPoints: ['dist/banner/banner.js'],
  outfile: 'dist/banner/banner.esbuild.js',
  external: [
    'path',
  ],
  format: 'cjs',
};

/** @type esbuild.BuildOptions */
const serverConfig = {
  ...defaultOptions,
  entryPoints: ['dist/server/server.js'],
  outfile: 'dist/npm/server/index.js',
  external: [
    'fs',
    'path',
    'typescript/lib/tsserverlibrary',
    'vscode-languageserver',
    'vscode-uri',
    'vscode-jsonrpc',
  ],
  // TODO(atscott): Figure out how to use the banner correctly.
  // iife format produces a `require("typescript/lib/tsserverlibrary");` line but it needs to use
  // the `define` in the banner to resolve tsserverlibrary.
  format: 'iife',
};

async function build() {
  try {
    await esbuild.build(clientConfig);
    await esbuild.build(bannerConfig);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

build();
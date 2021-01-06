#!/usr/bin/env bash

set -ex -o pipefail

# Enable extended pattern matching features
shopt -s extglob

# Clean up from last build
rm -rf dist
rm -rf **/*.tsbuildinfo

# Build the client and server
yarn run compile

# Copy files to package root
cp package.json angular.png CHANGELOG.md README.md dist/npm
# Copy files to server directory
cp -r server/package.json server/README.md server/bin dist/npm/server
# Build and copy files to syntaxes directory
yarn run build:syntaxes
mkdir dist/npm/syntaxes
# Copy all json files in syntaxes/ except tsconfig.json
cp syntaxes/!(tsconfig).json dist/npm/syntaxes

pushd dist/npm
# TODO(kyliau): vsce does not bundle nested node_modules due to bug
# https://github.com/microsoft/vscode-vsce/issues/432 so install using NPM for now.
npm install --production --ignore-scripts

sed -i -e 's#./dist/client/extension#./index#' package.json
../../node_modules/.bin/vsce package

popd

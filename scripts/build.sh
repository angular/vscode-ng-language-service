#!/usr/bin/env bash

set -ex -o pipefail

# Clean up from last build
rm -rf client/out
rm -rf server/out
rm -rf dist
rm -rf **/*.tsbuildinfo

# Build the client and server
yarn run compile

# Copy files to package root
cp package.json yarn.lock angular.png CHANGELOG.md README.md dist
# Copy files to client directory
cp client/package.json client/yarn.lock dist/client
# Copy files to server directory
cp server/package.json server/yarn.lock server/README.md dist/server
# Copy files to syntaxes directory
mkdir dist/syntaxes
cp syntaxes/*.json dist/syntaxes

pushd dist
yarn install --production --ignore-scripts

pushd client
yarn install --production --ignore-scripts
popd

pushd server
yarn install --production --ignore-scripts
popd

sed -i -e 's#./client/out/extension#./client#' package.json
../node_modules/.bin/vsce package --yarn --out ngls.vsix

popd

#!/usr/bin/env bash

set -ex -o pipefail

# Clean up from last build
rm -rf client/out
rm -rf server/out

# Build the client and server
yarn run compile

rm -rf dist
mkdir dist
cp package.json yarn.lock angular.png README.md dist
mkdir dist/client
cp client/package.json client/yarn.lock dist/client
cp client/out/*.js dist/client
mkdir dist/server
cp server/package.json server/yarn.lock dist/server
cp server/out/*.js dist/server

pushd dist
yarn install --production --ignore-scripts

pushd client
yarn install --production --ignore-scripts
popd

pushd server
yarn install --production --ignore-scripts
popd

sed -i -e 's#./client/out/extension#./client/extension#' package.json
../node_modules/.bin/vsce package --yarn --out ngls.vsix

popd

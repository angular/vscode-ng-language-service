#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:BUILD'

# Setup the environment
cd $(dirname $0)
source ./env.sh
cd ../..

# Build the server
echo 'travis_fold:start:build.server'
(
  cd server
  yarn run compile
)
echo 'travis_fold:end:build.server'

# Build the client
echo 'travis_fold:start:build.client'
(
  cd client
  $(yarn bin)/tsc
)
echo 'travis_fold:end:build.client'

# Install server production dependencies
echo 'travis_fold:start:build.server.deps'
(
  cd client/server
  yarn install --production
)
echo 'travis_fold:end:build.server.deps'

# Build the .vsix file
echo 'travis_fold:start:build.vsix'
(
  mkdir dist
  cd client
  vsce package --out ../dist/ngls.vsix
)
echo 'travis_fold:end:build.vsix'

echo 'travis_fold:end:BUILD'

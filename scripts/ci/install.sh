#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:INSTALL'

# Setup the environment
cd $(dirname $0)
source ./env.sh
cd ../..

# Install npm version we need
echo 'travis_fold:start:install.npm'
npm install -g npm@${NPM_VERSION}
echo 'travis_fold:end.install.npm'

# Install vsce
echo 'travis_fold:start:install.vsce'
npm install -g vsce
echo 'travis_fold:end:install.vsce'

# Install all npm server dependencies
echo 'travis_fold:start:install.server.node_modules'
(
  cd server
  npm install
)
echo 'travis_fold:end:install.server.node_modules'

# Install all npm client dependencies
echo 'travis_fold:start:install.client.node_modules'
(
  cd client
  npm install
)
echo 'travis_fold:end:install.client.node_modules'

echo 'travis_fold:end:INSTALL'
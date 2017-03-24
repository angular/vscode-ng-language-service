#!/usr/bin/env bash

set -ex -o pipefail

# Setup the environment
cd $(dirname $0)
source ./env.sh
cd ../..

# Install vsce
yarn global add vsce

# Install all npm server dependencies
(
  cd server
  yarn
)

# Install all npm client dependencies
(
  cd client
  yarn
)

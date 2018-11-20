#!/usr/bin/env bash

set -ex -o pipefail

# Setup the environment
cd $(dirname $0)
source ./env.sh
cd ..

# Install all server dependencies
(
  cd server
  rm -rf node_modules
  yarn
)

# Install all client dependencies
(
  cd client
  rm -rf node_modules
  yarn
)

# Install all test tools dependencies
(
  cd tests/tools
  rm -rf node_modules
  yarn
)

# Install all example project dependencies
(
  cd tests/project
  rm -rf node_modules
  yarn
)

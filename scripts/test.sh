#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:TEST'

# Server unit tests
(
  cd server
  yarn run test
)

# Server smoke test
(
  cd tests/tools
  yarn run test
)

echo 'travis_fold:end:TEST'

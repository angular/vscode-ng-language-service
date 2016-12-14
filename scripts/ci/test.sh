#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:TEST'

# Server unit tests
(
  cd server
  npm run test
)

# Server smoke test
tests/tests.sh

echo 'travis_fold:end:TEST'
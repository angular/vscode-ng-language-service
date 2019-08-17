#!/usr/bin/env bash

set -ex -o pipefail

# Install test project dependencies
(
  cd integration/project
  yarn
)

# Server unit tests
yarn run test

# Server smoke test
yarn run test:integration

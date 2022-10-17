#!/usr/bin/env bash

set -ex -o pipefail

yarn bazel test //...

# E2E test that brings up full vscode
# TODO: Disabled for now because it cannot be run on CircleCI
# bazel test --test_output=streamed //integration/e2e:test

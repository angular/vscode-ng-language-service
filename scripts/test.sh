#!/usr/bin/env bash

set -ex -o pipefail

# Install test project dependencies
if [[ -z "${CI}" ]]; then
  (cd integration/project && yarn)
  (cd integration/pre_apf_project && yarn)
  (cd integration/workspace && yarn)
fi

# Server unit tests
yarn run test

# Smoke test for LSP
yarn run test:lsp

# E2E test that brings up full vscode
# TODO: Disabled for now because it cannot be run on CircleCI
# yarn run test:e2e

# Syntaxes tests
yarn run test:syntaxes
# Check git status to see if there are modified files
STATUS="$(git status --porcelain)"
echo $STATUS
# If the status contains modified files in the syntaxes folder, they are out of date
if [[ "$STATUS" == *"syntaxes"* ]]; then
  echo 'Syntax files are out-of-sync with source. Please run "yarn run build:syntaxes".'
  exit 1
fi
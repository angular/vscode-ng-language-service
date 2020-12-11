#!/usr/bin/env bash

set -ex -o pipefail

# Install test project dependencies
(
  cd integration/project
  yarn
  yarn ngcc
)

# Server unit tests
yarn run test

# Smoke test for LSP
yarn run test:lsp

# E2E test that brings up full vscode
# TODO: Disabled for now because it cannot be run on Travis
# yarn run test:e2e

# Syntaxes tests
yarn run test:syntaxes
if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Syntax files are out-of-sync with source. Please run "yarn run build:syntaxes".'
  exit 1
fi

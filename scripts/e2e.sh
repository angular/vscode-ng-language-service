#!/usr/bin/env bash

set -ex -o pipefail

export NG_DEBUG="true"
export CODE_TESTS_PATH="$(pwd)/integration/out/e2e"
export CODE_TESTS_WORKSPACE="$(pwd)/integration/project"

node "$(pwd)/node_modules/vscode/bin/test"

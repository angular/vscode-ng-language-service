#!/usr/bin/env bash
# Usage:
#   scripts/syntax.sh [-u]
#
# Arguments:
#   -u update snapshot files

set -ex -o pipefail

DUMMY_GRAMMARS=$(find syntaxes/test -name '*-dummy.json' -exec echo "-g {}" \; | tr '\n' ' ')
ARGS=$(cat<<ARGS
  -s inline-template.ng 
  -g syntaxes/inline-template.json $DUMMY_GRAMMARS
  -t syntaxes/test/**/*.ts
ARGS
)

# Snapshot tests
yarn vscode-tmgrammar-snap $ARGS "$@"

#!/usr/bin/env bash

set -ex -o pipefail

DUMMY_GRAMMARS=$(find syntaxes/test -name '*-dummy.json' -exec echo "-g {}" \; | tr '\n' ' ')

# Template syntax tests
yarn vscode-tmgrammar-test \
  -s template.ng \
  -g syntaxes/template.ng.json $DUMMY_GRAMMARS \
  -t "syntaxes/test/**/*.ts"

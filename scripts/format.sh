#!/usr/bin/env bash

set -ex -o pipefail

find . -name "*.ts" \
  -not -path "*/.vscode*" \
  -not -path "*/project/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -exec yarn clang-format -i {} +

find syntaxes/ -name "*.json" \
  -exec yarn prettier --write {} +

if [[ -n "${CIRCLECI}" && -n "$(git status --porcelain)" ]]; then
  echo "Files not formatted; please run 'yarn format'."
  exit 1
fi

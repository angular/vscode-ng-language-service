#!/usr/bin/env bash

set -ex -o pipefail

pnpm install

find . -name "*.ts" \
  -not -path "*/.vscode*" \
  -not -path "*/project/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -exec pnpm clang-format -i {} +

find syntaxes/ -name "*.json" \
  -exec pnpm prettier --write {} +

if [[ -n "${CIRCLECI}" && -n "$(git status --porcelain)" ]]; then
  echo "Files not formatted; please run 'yarn format'."
  exit 1
fi

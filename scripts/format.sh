#!/usr/bin/env bash

set -ex -o pipefail

find . -name "*.ts" \
  -not -path "*/.vscode*" \
  -not -path "*/project/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/out/*" \
  -exec yarn clang-format -i {} +

if [[ ! -z "${CI_MODE}" ]]; then
  git diff --diff-filter=ACMRT --exit-code || (echo "Files not formatted; please run 'yarn format'." && exit 1)
fi

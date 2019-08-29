#!/usr/bin/env bash

set -ex -o pipefail

find . -name "*.ts" \
  -not -path "*/project/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/out/*" \
  -exec yarn clang-format -i {} +

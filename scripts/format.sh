#!/usr/bin/env bash

set -ex -o pipefail

pnpm format;

if [[ -n "${CIRCLECI}" && -n "$(git status --porcelain)" ]]; then
  echo "Files not formatted; please run 'pnpm format'."
  exit 1
fi

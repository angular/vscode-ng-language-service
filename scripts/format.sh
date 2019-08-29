#!/usr/bin/env bash

set -ex -o pipefail

yarn clang-format -i client/**/*.ts
yarn clang-format -i integration/**/*.ts
yarn clang-format -i server/**/*.ts

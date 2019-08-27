#!/usr/bin/env bash

set -ex -o pipefail

yarn tslint --project client/tsconfig.json
yarn tslint --project server/tsconfig.json
yarn tslint --project server/src/tests/tsconfig.json

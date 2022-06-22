#!/usr/bin/env bash

set -ex -o pipefail

yarn tsc --project .ng-dev/tsconfig.json

yarn tslint --project client/tsconfig.json
yarn tslint --project server/tsconfig.json
yarn tslint --project server/src/tests/tsconfig.json
yarn tslint --project syntaxes/tsconfig.json

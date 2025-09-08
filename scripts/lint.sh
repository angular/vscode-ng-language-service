#!/usr/bin/env bash

set -ex -o pipefail

pnpm tsc --project .ng-dev/tsconfig.json

pnpm tslint --project client/tsconfig.json
pnpm tslint --project server/tsconfig.json
pnpm tslint --project server/src/tests/tsconfig.json
pnpm tslint --project syntaxes/tsconfig.json

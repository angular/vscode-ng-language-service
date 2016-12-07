#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:TEST'

tests/tests.sh

echo 'travis_fold:end:TEST'
#!/usr/bin/env bash

set -e -o pipefail

NPM_VERSION=3.5.3
SHA=$(git log --oneline -1 | awk '{print $1}')
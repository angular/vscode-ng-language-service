#!/usr/bin/env bash

set -e -o pipefail

SHA=$(git log --oneline -1 | awk '{print $1}')
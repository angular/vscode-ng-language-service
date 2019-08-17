#!/usr/bin/env bash

set -ex -o pipefail

# Clean up from last build
rm -rf client/out
rm -rf server/out

# Build the client and server
yarn run compile

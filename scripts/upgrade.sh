#!/usr/bin/env bash

# This script can be used to upgrade the language service dependencies to the
# latest version. Notably, it should update @angular/language-service and
# typescript

set -ex -o pipefail

# Setup the environment
cd $(dirname $0)
source ./env.sh
cd ..

# Upgrade all server dependencies
(
  cd server
  yarn upgrade --latest
)

# Upgrade all client dependencies
(
  cd client
  yarn upgrade --latest
)

# Upgrade all test tools dependencies
(
  cd tests/tools
  yarn upgrade --latest
)

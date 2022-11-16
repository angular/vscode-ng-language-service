#!/usr/bin/env bash

DEPENDENCY_TYPE=$1
USE_PACKAGE_JSON=false
USE_BUILDS_REPO=false

if [ "$DEPENDENCY_TYPE" = "package.json" ]; then
  USE_PACKAGE_JSON=true
  echo "Using the dependencies defined in package.json"
elif [ "$DEPENDENCY_TYPE" = "builds-repo" ]; then
  USE_BUILDS_REPO=true
  echo "Use the latest dependency from builds repo."
else
  echo "Please provide a valid dependency type as the first argument: 'package.json' or 'builds-repo'"
  echo
  echo "Usage example:"
  echo "  $0 package.json"
  exit 1;
fi

if [ "$USE_BUILDS_REPO" = true ]; then
  for dep in "language-service"; do
    echo $(node -e "
        const pkgJson = require('./package.json');
        pkgJson['dependencies']['@angular/$dep'] = 'https://github.com/angular/$dep-builds.git';
        console.log(JSON.stringify(pkgJson));
        ") > package.json
  done
fi

set -ex -o pipefail

# Run legacy yarn install to update the lock file since we may have modified the package.json above
# and so that we can call bazel via yarn bazel
yarn install

# Clear previous "npm_package" outputs. This is workaround used in
# all release scripts of Angular. We need to do this to ensure that
# the version placeholders are properly populated. See:
# https://github.com/bazelbuild/rules_nodejs/issues/1219..
rm -Rf bazel-bin/npm

# Build the npm package with bazel
yarn bazel build //:npm --config=release

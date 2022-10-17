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

# Clean up from last build
rm -rf dist

# Run legacy yarn install to update the lock file since we may have modified the package.json above
# and so that we can call bazel via yarn bazel
yarn install

# Build the npm package with bazel
yarn bazel build //:npm

# Copy the bazel built package to dist/npm_bazel
# TODO: copy to dist/npm when ready to cut-over
mkdir -p dist/npm_bazel
cp -r bazel-bin/npm/ dist/npm_bazel
chmod -R +w dist/npm_bazel

################################################################################
#### LEGACY PRE-BAZEL BUILD --- can be removed after cut-over
################################################################################

# Enable extended pattern matching features
shopt -s extglob

# Clean up from last build
rm -rf **/*.tsbuildinfo

# Build the client and server
yarn run compile

# install npm packages in the pinned v12
pushd v12_language_service
yarn install
popd

# Copy files to package root
cp package.json angular.png CHANGELOG.md README.md dist/npm
# Copy files to server directory
cp -r server/package.json server/README.md server/bin dist/npm/server
cp -r v12_language_service dist/npm/v12_language_service
# Build and copy files to syntaxes directory
yarn run build:syntaxes
mkdir dist/npm/syntaxes
# Copy all json files in syntaxes/ except tsconfig.json
cp syntaxes/!(tsconfig).json dist/npm/syntaxes

pushd dist/npm
# TODO(kyliau): vsce does not bundle nested node_modules due to bug
# https://github.com/microsoft/vscode-vsce/issues/432 so install using NPM for now.
# Note: We also use `--force` as NPM incorrectly checks the dev dependencies even
# though we have limited the install to production-only dependencies. We know that
# our versions are compatible from the Yarn install, so it's acceptable to force proceed
# on peer dependency conflicts (like `tslint@6` not being supported by `tslint-eslint-rules`).
npm install --production --ignore-scripts --force

sed -i -e 's#./dist/client/src/extension#./index#' package.json
../../node_modules/.bin/vsce package

popd

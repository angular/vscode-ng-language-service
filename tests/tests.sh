#!/usr/bin/env bash

set -ex -o pipefail

cd $(dirname $0)

echo build the tools
(
	cd tools
	yarn
	$(yarn bin)/tsc
)

echo install project dependencies
(
	cd project
	yarn
)

echo run startup test
(
	node tools/dist/mock-host --file assets/startup-test.json --pwd $(pwd) | node ../client/server/server.js --stdio | node tools/dist/validate-expected --expect assets/startup-golden.json
)

echo run completion test
(
	if [[ "${CI_MODE}" == "normal" ]]; then
	  echo Completion test disabled during CI because it is flakey. Please be sure it passes locally!
	else
	  node tools/dist/mock-host --file assets/completion-test.json --pwd $(pwd) | node ../client/server/server.js --stdio | node tools/dist/validate-expected --expect assets/completion-golden.json
	fi
)
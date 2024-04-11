#!/bin/bash
set -e

current_directory="$PWD"

cd $(dirname $0)

yarn release --dry-run --no-ci --debug | grep -i 'The next release version is' | awk '{print $NF}' > ../.VERSION && cp .VERSION ../dist/

cd "$current_directory"

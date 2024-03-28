#!/bin/bash
set -e

SCRIPT_DIR="$PWD"

# get bundle directory
cd $(dirname $0)/../dist/bundle
BUNDLE_DIR="$PWD"
BUNDLE_PATH="$BUNDLE_DIR/index.js"

echo $BUNDLE_PATH

cd "$SCRIPT_DIR"

if [[ -z "${ENVIRONMENT}" ]]; then
    echo "ENVIRONMENT environment variable is not set"
    exit 1
fi

if [ "${ENVIRONMENT}" = dev  ]; then
    BUNDLE_HOST="3ds.flock-dev.com"
else
    BUNDLE_HOST="3ds.basistheory.com"
fi

# get sdk versions
MAJOR_VERSION=$(cat package.json | jq -r '.version' | cut -d. -f1)
MINOR_VERSION=$(cat package.json | jq -r '.version' | cut -d. -f2)

# get versioned paths
LATEST_VERSION_PATH="index.js"
MAJOR_VERSION_PATH="v$MAJOR_VERSION/index.js"
MINOR_VERSION_PATH="v$MAJOR_VERSION.$MINOR_VERSION/index.js"


if [ "$IS_PR_WORKFLOW" = true ] ; then
  # upload blob bundle
  BLOB_DIR=blob
  BLOB_PATH=$BLOB_DIR/$(git rev-parse --short HEAD).js

  echo "Uploading SDK bundle to $BUNDLE_HOST/$BLOB_PATH"

  aws s3 cp --acl public-read "$BUNDLE_PATH" s3://"${BUNDLE_HOST}"/"${BLOB_PATH}"

else
  # upload bundle to versioned paths
  echo "Uploading SDK bundle to $BUNDLE_HOST/$LATEST_VERSION_PATH"

  aws s3 cp --acl public-read "$BUNDLE_PATH" s3://"${BUNDLE_HOST}"/"${LATEST_VERSION_PATH}"

  echo "Uploading SDK bundle to $BUNDLE_HOST/$MAJOR_VERSION_PATH"

  aws s3 cp --acl public-read "$BUNDLE_PATH" s3://"${BUNDLE_HOST}"/"${MAJOR_VERSION_PATH}"

  echo "Uploading SDK bundle to $BUNDLE_HOST/$MINOR_VERSION_PATH"

  aws s3 cp --acl public-read "$BUNDLE_PATH" s3://"${BUNDLE_HOST}"/"${MAJOR_VERSION_PATH}"
fi

result=$?

cd "$SCRIPT_DIR"

exit $result

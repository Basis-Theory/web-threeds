#!/usr/bin/env bash
set -e

current_directory="$PWD"

if [[ -z "${CLOUDFLARE_API_KEY}" ]]; then
    echo "CLOUDFLARE_API_TOKEN environment variable is not set"
    exit 1
fi

if [[ -z "${TF_VAR_DATADOG_API_KEY}" ]]; then
    echo "TF_VAR_DATADOG_API_KEY environment variable is not set"
    exit 1
fi

if [[ -z "${TF_VAR_ENVIRONMENT}" ]]; then
    echo "TF_VAR_ENVIRONMENT environment variable is not set"
    exit 1
fi

export TF_VAR_VPN_IP="$(pulumi stack output --stack basistheory/infrastructure-operations/prod --json | jq -r .vpnPublicIp)"

if [[ -z "${TF_VAR_VPN_IP}" ]]; then
    echo "TF_VAR_VPN_IP environment variable is not set"
    exit 1
fi

exitStatus=0

cd $(dirname $0)/../BasisTheory.Infrastructure.Cloudflare/Infrastructure

if [[ ${TF_VAR_ENVIRONMENT} == "dev" ]]; then
  terraform init -backend-config="key=basistheory-cloudflare/${TF_VAR_ENVIRONMENT}/terraform.tfstate"
else
  terraform init -backend-config="key=basistheory-cloudflare/${TF_VAR_ENVIRONMENT}/terraform.tfstate"
fi

if [ "$IS_PR_WORKFLOW" = true ] ; then
  terraform version

  terraform fmt

  terraform validate -no-color

  terraform plan -no-color --var-file="${TF_VAR_ENVIRONMENT}".tfvars
else
  terraform apply -auto-approve --var-file="${TF_VAR_ENVIRONMENT}".tfvars
fi

result=$?

cd "$current_directory"

exit $result
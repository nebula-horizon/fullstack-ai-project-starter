#!/usr/bin/env bash
#
# One-time bootstrap: create the OpenTofu state bucket by hand, because
# OpenTofu needs somewhere to keep state before it can create anything itself.
#
# Run once per environment by the admin, with temporary elevated credentials for
# that environment's account, and keep the output. It is not a deploy path:
# everything after bootstrap goes through CI.
#
#   BUCKET=<state-bucket-dev> REGION=<region> ./create-state-bucket.sh
set -euo pipefail

: "${BUCKET:?set BUCKET to the state bucket name for this environment}"
: "${REGION:?set REGION to the AWS region of this environment}"

aws s3api create-bucket --bucket "$BUCKET" \
  --region "$REGION" --create-bucket-configuration "LocationConstraint=$REGION"

aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'

echo "State bucket $BUCKET ready. Its read-restricting bucket policy is applied by OpenTofu (iam-github-actions.tf)."

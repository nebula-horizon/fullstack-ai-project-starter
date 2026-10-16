#!/usr/bin/env bash
#
# Plan gate: refuse a plan that would delete or replace a stateful resource.
#
#   check-protected-resources.sh <plan-file>
#
# Only deletion and replacement are blocked. Creating a protected resource is
# fine — a brand-new environment's first plan creates all of them.
#
# Fails closed: if the plan cannot be read or parsed, the script exits non-zero
# rather than reporting "nothing found".
set -euo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "usage: $(basename "$0") <plan-file>" >&2
  exit 2
fi

# Resource types whose loss means lost data or a long outage. A bucket rename is
# a replacement, so buckets are on the list.
protected_types=(
  aws_cloudfront_distribution
  aws_db_instance
  aws_ecr_repository
  aws_elasticache_replication_group
  aws_rds_cluster
  aws_s3_bucket
  aws_secretsmanager_secret
  aws_vpc
)

plan_json="$(tofu show -json "$1")"

# Pass the type list into jq as JSON and match whole action lists:
# ["delete"] is a destroy, ["delete","create"] / ["create","delete"] a replacement.
types_json="$(printf '%s\n' "${protected_types[@]}" | jq -R . | jq -s .)"
offenders="$(
  jq -r --argjson types "$types_json" '
    [.resource_changes // [] | .[]
      | select(.type as $t | $types | index($t))
      | select(.change.actions as $a
          | $a == ["delete"] or $a == ["delete","create"] or $a == ["create","delete"])
      | "\(.address)  (\(.change.actions | join(" then ")))"]
    | .[]' <<<"$plan_json"
)"

if [[ -n "$offenders" ]]; then
  echo "::error::This plan deletes or replaces protected resources. Fix the change, or override deliberately and on record."
  printf '%s\n' "$offenders" >&2
  exit 1
fi

echo "Plan gate passed: no protected resource is deleted or replaced."

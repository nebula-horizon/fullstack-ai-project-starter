#!/usr/bin/env bash
#
# Post-deploy health check: poll the deployed endpoint and fail the job if it
# never answers with 2xx/3xx, so a broken deploy shows up as a red CI run.
#
#   health-check.sh <url> [attempts] [sleep-seconds]
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $(basename "$0") <url> [attempts] [sleep-seconds]" >&2
  exit 2
fi

URL="$1"
ATTEMPTS="${2:-20}"
SLEEP="${3:-15}"

for ((i = 1; i <= ATTEMPTS; i++)); do
  status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$URL" || true)"
  if [[ "$status" =~ ^(2|3)[0-9][0-9]$ ]]; then
    echo "Health check passed: $URL → $status (attempt $i)"
    exit 0
  fi
  echo "Attempt $i/$ATTEMPTS: $URL → ${status:-no response}; retrying in ${SLEEP}s"
  sleep "$SLEEP"
done

echo "::error::Health check failed: $URL did not return 2xx/3xx after $ATTEMPTS attempts."
exit 1

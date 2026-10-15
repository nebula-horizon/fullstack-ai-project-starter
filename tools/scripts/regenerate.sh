#!/usr/bin/env bash
#
# Regenerate every generated file this repository commits, exactly as CI does.
# CI runs it and fails if `git diff` then shows a change, so a committed copy
# can never go stale. Why each file is committed: docs/workflows/generated-files.md
#
#   tools/scripts/regenerate.sh     (or: mise run generate)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# 1. apps/api/.adonisjs — AdonisJS codegen boots the app config, so it needs a
#    complete environment. Real values win; otherwise harmless placeholders are
#    used. Nothing here connects anywhere.
(
  cd apps/api
  NODE_ENV="${NODE_ENV:-development}" \
    PORT="${PORT:-3333}" \
    HOST="${HOST:-localhost}" \
    LOG_LEVEL="${LOG_LEVEL:-info}" \
    APP_KEY="${APP_KEY:-codegen-placeholder-not-a-real-key-00}" \
    APP_URL="${APP_URL:-http://localhost:3333}" \
    DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54332/postgres}" \
    JWT_SECRET="${JWT_SECRET:-codegen-placeholder-not-a-real-secret-00000000}" \
    node --import tsx ace.js codegen
)

# 2. packages/contracts/src/api.d.ts — from packages/contracts/openapi.yaml.
pnpm --filter @template/contracts run build

# 3. apps/web/src/routeTree.gen.ts — the TanStack Router plugin rewrites it on
#    every build; the build output itself is discarded (dist/ is ignored).
pnpm --filter @template/web run build

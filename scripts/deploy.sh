#!/usr/bin/env bash
#
# MaybeTomorrow.store — deploy script
# -----------------------------------
# Idempotent build + PM2 reload. Safe to run on every deploy; also safe to run
# on a fresh box where `mt-store` has never been started (falls back to
# `pm2 start`).
#
# Usage:  ./scripts/deploy.sh
#
set -euo pipefail

# Resolve the project root regardless of where the script is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

APP_NAME="mt-store"
ECOSYSTEM="ecosystem.config.js"

echo "==> [mt-store] Deploy starting in ${PROJECT_ROOT}"

# ---------------------------------------------------------------------------
# 1. Build the Next.js standalone bundle.
# ---------------------------------------------------------------------------
echo "==> [mt-store] npm run build"
npm run build

# ---------------------------------------------------------------------------
# 2. Reload under PM2 (or start cold if the app isn't registered yet).
#    --update-env re-reads ecosystem.config.js so env changes take effect
#    without a full restart.
# ---------------------------------------------------------------------------
if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
  echo "==> [mt-store] pm2 reload ${ECOSYSTEM} --update-env"
  pm2 reload "${ECOSYSTEM}" --update-env
else
  echo "==> [mt-store] pm2 start ${ECOSYSTEM} (first-time start)"
  pm2 start "${ECOSYSTEM}"
fi

# ---------------------------------------------------------------------------
# 3. Persist the process list so it survives reboots.
# ---------------------------------------------------------------------------
pm2 save

echo "==> [mt-store] Deploy complete."
pm2 describe "${APP_NAME}" | grep -E "status|uptime|restarts" || true

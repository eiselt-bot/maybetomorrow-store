#!/usr/bin/env bash
#
# MaybeTomorrow.store — one-shot server setup reference
# -----------------------------------------------------
# This script documents every command needed to bring a fresh mahelya VPS
# (or any Ubuntu 24.04 box) to a working MaybeTomorrow.store deployment.
#
# It is intentionally NOT fully automated — some steps (certbot, DNS, IONOS
# API credentials) require human interaction. Read each section, confirm it
# matches your environment, and run the commands manually.
#
# Prerequisites already present on mahelya (see memory/server-mahelya.md):
#   - Ubuntu 24.04 LTS
#   - Node.js 22
#   - PM2 (global npm install)
#   - Nginx
#   - Docker + Postgres 16 container on :5432
#   - User `claude-admin` with sudo
#
set -euo pipefail

PROJECT_ROOT="/home/claude-admin/maybetomorrow-store"
DB_NAME="maybetomorrow"
DB_USER="claudeadmin"
DB_PASS='Zukunft.2323'   # matches existing Docker Postgres on :5432

# ============================================================================
# 1. Postgres database
# ----------------------------------------------------------------------------
# ALREADY DONE on mahelya (2026-04-09). Kept here for reference / rebuilds.
#
# The Postgres container on mahelya runs under Docker Compose. Create the
# MaybeTomorrow DB by exec-ing into the container:
#
#   docker exec -i $(docker ps -qf name=postgres) \
#     psql -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"
#
# Verify:
#   docker exec -i $(docker ps -qf name=postgres) \
#     psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT current_database();"
#
# ============================================================================

# ============================================================================
# 2. Clone / pull the project
# ============================================================================
if [ ! -d "${PROJECT_ROOT}" ]; then
  echo "==> Clone the repo into ${PROJECT_ROOT}"
  # git clone <repo-url> "${PROJECT_ROOT}"
  echo "    (repo URL not yet configured — clone manually)"
fi

cd "${PROJECT_ROOT}"

# ============================================================================
# 3. Install dependencies
# ============================================================================
echo "==> Installing npm dependencies"
npm ci

# ============================================================================
# 4. Environment file
# ----------------------------------------------------------------------------
# Copy .env.example to .env and fill in the blanks (ANTHROPIC_API_KEY,
# CLAURICE_WHATSAPP_PHONE, etc). NEXTAUTH_SECRET / AUTH_SECRET must be
# unique per deployment — regenerate with `openssl rand -hex 32`.
# ============================================================================
if [ ! -f "${PROJECT_ROOT}/.env" ]; then
  echo "==> Creating .env from template"
  cp .env.example .env
  echo "    !! Edit .env and fill in secrets before continuing."
fi

# ============================================================================
# 5. Drizzle schema push
# ============================================================================
echo "==> Pushing Drizzle schema to Postgres"
npm run db:push

# Optional: seed demo data.
# npm run db:seed

# ============================================================================
# 6. Uploads directory
# ============================================================================
if [ ! -d /var/mt-store/uploads ]; then
  echo "==> Creating /var/mt-store/uploads"
  sudo mkdir -p /var/mt-store/uploads
  sudo chown claude-admin:claude-admin /var/mt-store/uploads
  sudo chmod 755 /var/mt-store/uploads
fi

# ============================================================================
# 7. Build and start under PM2
# ============================================================================
echo "==> Building and starting under PM2"
./scripts/deploy.sh

# ============================================================================
# 8. Nginx vhost
# ----------------------------------------------------------------------------
# Manual step — requires sudo.
#
#   sudo cp deploy/nginx-maybetomorrow.conf \
#           /etc/nginx/sites-available/maybetomorrow
#   sudo ln -sf /etc/nginx/sites-available/maybetomorrow \
#              /etc/nginx/sites-enabled/maybetomorrow
#   sudo nginx -t && sudo systemctl reload nginx
#
# ============================================================================

# ============================================================================
# 9. TLS — Let's Encrypt wildcard via certbot-dns-ionos
# ----------------------------------------------------------------------------
# See deploy/README.md sections 3-5 for the full walkthrough. Summary:
#
#   sudo apt install -y certbot python3-pip
#   sudo pip install certbot-dns-ionos --break-system-packages
#   # Store IONOS API credentials in /etc/letsencrypt/ionos.ini (chmod 600).
#   sudo certbot certonly --dns-ionos \
#     --dns-ionos-credentials /etc/letsencrypt/ionos.ini \
#     -d 'maybetomorrow.store' -d '*.maybetomorrow.store'
#
# ============================================================================

# ============================================================================
# 10. Currency cron
# ----------------------------------------------------------------------------
# Add to the claude-admin crontab (`crontab -e`):
#
#   0 6 * * * cd /home/claude-admin/maybetomorrow-store && /usr/bin/npm run currency:fetch >> /var/log/mt-currency.log 2>&1
#
# Make sure /var/log/mt-currency.log is writable by claude-admin:
#
#   sudo touch /var/log/mt-currency.log
#   sudo chown claude-admin:claude-admin /var/log/mt-currency.log
#
# ============================================================================

echo ""
echo "==> Setup reference complete. Remaining manual steps:"
echo "    1. DNS records at IONOS (A @, A *)"
echo "    2. Certbot wildcard issuance (see deploy/README.md)"
echo "    3. Nginx vhost install + reload"
echo "    4. Crontab entry for currency:fetch"

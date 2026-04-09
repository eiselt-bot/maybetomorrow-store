#!/usr/bin/env bash
# mt-store watchdog — runs every 5min via cron, pings /api/health,
# sends a Telegram alert to Frank if the check fails or returns 503.
#
# Cron entry (installed by apply.sh):
#   */5 * * * * /home/claude-admin/maybetomorrow-store/scripts/watchdog.sh >/dev/null 2>&1
#
# State is in /tmp/mt-watchdog.state so we don't spam when the outage lasts.

set -euo pipefail

HEALTH_URL="http://127.0.0.1:3003/api/health"
STATE_FILE="/tmp/mt-watchdog.state"
LOG_FILE="/var/log/mt-watchdog.log"
# Telegram details pulled from the mt-store .env
ENV_FILE="/home/claude-admin/maybetomorrow-store/.env"
TELEGRAM_BOT_TOKEN=$(grep -E '^WATCHDOG_TELEGRAM_BOT_TOKEN=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || echo "")
TELEGRAM_CHAT_ID=$(grep -E '^WATCHDOG_TELEGRAM_CHAT_ID=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || echo "")

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] $1" | sudo tee -a "$LOG_FILE" >/dev/null 2>&1 || echo "[$(timestamp)] $1" >> /tmp/mt-watchdog-fallback.log; }

notify() {
    local msg="$1"
    if [[ -n "$TELEGRAM_BOT_TOKEN" && -n "$TELEGRAM_CHAT_ID" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=${msg}" \
            -d "parse_mode=Markdown" >/dev/null 2>&1 || true
    fi
}

# Hit the health endpoint
HTTP_CODE=$(curl -s -o /tmp/mt-watchdog-body -w '%{http_code}' -m 10 "$HEALTH_URL" || echo 000)
BODY=$(head -c 500 /tmp/mt-watchdog-body 2>/dev/null || echo "")

LAST_STATE=$(cat "$STATE_FILE" 2>/dev/null || echo "unknown")

if [[ "$HTTP_CODE" == "200" ]]; then
    if [[ "$LAST_STATE" == "down" ]]; then
        log "RECOVERED — $HTTP_CODE"
        notify "✅ *mt-store RECOVERED*"
    fi
    echo "up" > "$STATE_FILE"
else
    log "DOWN — HTTP=$HTTP_CODE body=$BODY"
    # Only send Telegram on state transition (up→down) to avoid spam
    if [[ "$LAST_STATE" != "down" ]]; then
        notify "🚨 *mt-store DOWN*%0A\`HTTP ${HTTP_CODE}\`%0A${BODY:0:200}"
    fi
    echo "down" > "$STATE_FILE"
fi

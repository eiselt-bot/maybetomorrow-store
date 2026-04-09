#!/usr/bin/env bash
# Daily pg_dump of the maybetomorrow database on mahelya.
# Cron: 0 3 * * * /home/claude-admin/maybetomorrow-store/scripts/backup.sh
#
# Dumps are gzipped, named by date, kept for 14 days.
# Destination: /home/claude-admin/backups/mt-store/

set -euo pipefail

BACKUP_DIR="/home/claude-admin/backups/mt-store"
DB_CONTAINER="postgres"
DB_USER="claudeadmin"
DB_NAME="maybetomorrow"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/mt-${DATE}.sql.gz"

# Dump + gzip in a single pipeline so we never materialise a 100MB+
# plaintext dump on disk.
if docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUT"; then
    SIZE=$(stat -c%s "$OUT" 2>/dev/null || echo 0)
    echo "[$(date '+%H:%M:%S')] backup ok: $OUT ($SIZE bytes)"
else
    echo "[$(date '+%H:%M:%S')] backup FAILED" >&2
    rm -f "$OUT"
    exit 1
fi

# Prune old backups
find "$BACKUP_DIR" -name 'mt-*.sql.gz' -mtime +${RETENTION_DAYS} -delete

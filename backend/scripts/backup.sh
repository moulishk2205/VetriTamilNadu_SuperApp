#!/bin/sh
# Database backup: a compressed, restorable pg_dump with rotation.
#   PG_CONTAINER=vetri-demo-postgres ./scripts/backup.sh        # default container: vetri-postgres
# Keeps the newest $KEEP dumps (default 14) in $BACKUP_DIR (default ./backups).
# Schedule it (cron/launchd) for daily backups; copy the folder off the host.
set -eu
PG_CONTAINER="${PG_CONTAINER:-vetri-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-14}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="$BACKUP_DIR/vetri-$STAMP.dump"

mkdir -p "$BACKUP_DIR"
# Custom format (-Fc): compressed, and pg_restore can restore all or part of it.
docker exec "$PG_CONTAINER" pg_dump -U vetri -d vetri -Fc > "$FILE.partial"
mv "$FILE.partial" "$FILE"
echo "Backup written: $FILE ($(du -h "$FILE" | cut -f1))"

# Rotation: drop all but the newest $KEEP dumps.
ls -1t "$BACKUP_DIR"/vetri-*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do rm -f "$old"; echo "Removed old backup: $old"; done

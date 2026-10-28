#!/bin/sh
# Restore a backup made by backup.sh. REPLACES the current database contents.
#   PG_CONTAINER=vetri-demo-postgres ./scripts/restore.sh backups/vetri-<stamp>.dump
set -eu
PG_CONTAINER="${PG_CONTAINER:-vetri-postgres}"
FILE="${1:?usage: restore.sh <backup.dump>}"
[ -f "$FILE" ] || { echo "No such backup: $FILE" >&2; exit 1; }

printf 'This replaces every table in %s with %s. Type RESTORE to continue: ' "$PG_CONTAINER" "$FILE"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

# --clean --if-exists drops each object before recreating it; one transaction,
# so a failed restore leaves the database as it was.
docker exec -i "$PG_CONTAINER" pg_restore -U vetri -d vetri --clean --if-exists --no-owner --single-transaction < "$FILE"
echo "Restored $FILE into $PG_CONTAINER."

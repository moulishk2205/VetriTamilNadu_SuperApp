#!/bin/sh
set -e

# Apply committed migrations only. Never `db push --accept-data-loss`: a schema
# drift must stop the boot, not silently drop columns.
# A database created by the old `db push` boot has no migration history; baseline
# it once before first use:
#   npx prisma migrate resolve --applied 20260711043522_migration
#   npx prisma migrate resolve --applied 20260806070225_add_scheme_2026_fields
echo "▶ Applying database migrations…"
tries=0
until npx prisma migrate deploy; do
  tries=$((tries + 1))
  if [ "$tries" -ge 20 ]; then
    echo "✖ prisma migrate deploy failed $tries times. Not starting." >&2
    exit 1
  fi
  echo "  …migrate deploy failed (database not ready?), retrying in 3s"
  sleep 3
done

# Seeding WIPES every table, so it runs only when SEED_ON_BOOT=true is set
# explicitly AND the citizen count query succeeds and returns 0. A failed count
# stops the boot instead of being read as "empty".
# The seed is COMPILED JavaScript (dist/prisma/seed.js) run by plain node.
if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
  echo "▶ SEED_ON_BOOT=true — checking seed state…"
  if ! COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.citizen.count().then(c=>{console.log(c);process.exit(0)}).catch(e=>{console.error(e.message);process.exit(1)})"); then
    echo "✖ Could not count citizens; refusing to seed. Not starting." >&2
    exit 1
  fi
  if [ "$COUNT" = "0" ]; then
    echo "▶ Database is empty — seeding demo data…"
    node dist/prisma/seed.js
  else
    echo "▶ Data present ($COUNT citizens) — skipping seed."
  fi
fi

echo "▶ Starting Vetri backend on :${PORT:-4000}"
exec node dist/main.js

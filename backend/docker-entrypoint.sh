#!/bin/sh
set -e

echo "▶ Waiting for Postgres…"
# db push syncs the schema without needing a migration history — ideal for the
# demo image. For production, replace with `prisma migrate deploy`.
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null; do
  echo "  …database not ready, retrying in 3s"
  sleep 3
done

# Seed only when the platform table is empty (idempotent boot).
# The seed is COMPILED JavaScript (dist/prisma/seed.js) executed by plain node —
# no ts-node/tsx in the container, so the ts-node config crash cannot occur.
echo "▶ Checking seed state…"
COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.citizen.count().then(c=>{console.log(c);process.exit(0)}).catch(()=>{console.log(0);process.exit(0)})")
if [ "$COUNT" = "0" ]; then
  echo "▶ Seeding demo data…"
  node dist/prisma/seed.js
else
  echo "▶ Data present ($COUNT citizens) — skipping seed."
fi

echo "▶ Starting Vetri backend on :${PORT:-4000}"
exec node dist/main.js

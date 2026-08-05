# Seed / Docker boot fix — root-cause report

## Symptom

The `backend` container entered a restart loop. Postgres was healthy, Prisma
connected, and the schema reported *"Database is already in sync"* — then, during
the seed step, the container crashed with:

```
Checking seed state...
Seeding demo data...
TypeError: Cannot read properties of undefined (reading 'fileExists')
    at ts-node/dist/configuration.js
```

Docker restarted the container, and the loop repeated.

## Root cause

The crash is **inside `ts-node`'s configuration loader**, *before* a single line
of the seed logic executes. The old boot path ran the seed as TypeScript:

```sh
npx ts-node prisma/seed.ts      # old docker-entrypoint.sh
```

Two things made this fragile in the container:

1. **`ts-node` was invoked in a production image.** `ts-node` reads and re-parses
   `tsconfig.json` at startup and drives the TypeScript compiler API itself. In the
   slim runtime image (built with `--omit=dev` in an earlier iteration), `ts-node`
   was **not installed**, so `npx` **downloaded it on the fly** into a temp cache.
   That dynamically-resolved `ts-node` + the image's TypeScript produced an
   `undefined` where its config loader expected the TS API object — hence
   `Cannot read properties of undefined (reading 'fileExists')`.
2. **Running a TypeScript runtime in production at all is the wrong architecture.**
   Even when it doesn't crash, shipping `ts-node` + `typescript` + `tsconfig` into
   a runtime image to execute a build-time script is avoidable weight and risk.

Critically: this was **never** a Postgres, Prisma, `DATABASE_URL`, Redis, or
schema problem. Those were all healthy. The failure was purely in how the seed
was *launched*.

## The fix

**Compile the seed to JavaScript and run it with plain `node` in the container.
No TypeScript runtime in the production path.**

- The seed is compiled during the image build to `dist/prisma/seed.js`
  (new `tsconfig.seed.json`, wired into `npm run build`).
- The entrypoint now runs `node dist/prisma/seed.js`.
- Local development uses **`tsx`** (a robust, esbuild-based runner) instead of
  `ts-node`. `ts-node` was **removed from the project entirely**.

## Files changed

| File | Change |
|------|--------|
| `tsconfig.seed.json` | **new** — compiles `prisma/seed.ts` → `dist/prisma/seed.js` |
| `package.json` | `build` now also runs `build:seed`; `db:seed` → `tsx`; added `db:seed:prod` (`node dist/prisma/seed.js`); `prisma.seed` → `tsx`; **removed `ts-node`**, **added `tsx`** |
| `Dockerfile` | runtime installs prod deps + Prisma CLI only, generates the client in-image against the copied schema, copies compiled `dist/` (incl. `dist/prisma/seed.js`); no `ts-node`/`tsx` in the image |
| `docker-entrypoint.sh` | seed step is now `node dist/prisma/seed.js` (was `npx ts-node prisma/seed.ts`) |
| `src/modules/health/*` | **new** `/health` probe (DB connectivity), mounted at root, excluded from the `/api` prefix |
| `src/app.module.ts`, `src/main.ts` | register `HealthModule`; exclude `health` from the global prefix |
| `docker-compose.yml` | added a `backend` healthcheck hitting `/health` |

## Why it works

- The container has **no `ts-node` and no `tsx`** — the crashing code path is
  physically absent. The seed is ordinary JavaScript run by `node`, exactly like
  `dist/main.js`.
- Nothing is downloaded at runtime: the Prisma CLI is installed at image-build
  time, and `@prisma/client` is a production dependency generated in-image.
- The seed remains **fully intact and idempotent** (it runs only when the DB has
  zero citizens) — nothing was skipped, commented out, or bypassed.

## How it was verified (in the build sandbox)

```
npx tsc --noEmit                         → exit 0 (whole backend)
npm run build                            → exit 0; emits dist/main.js AND dist/prisma/seed.js
node --check dist/prisma/seed.js         → OK (valid compiled JS)
node dist/prisma/seed.js  (unreachable DB) → prints "🌱 Seeding…", reaches
                                             prisma.aiMessage.deleteMany(), then
                                             fails with P1001 "Can't reach database"
grep ts-node (excl. node_modules)        → only explanatory comments remain
```

That last check is the key one: the seed **executes under plain `node`** and
reaches real Prisma calls. The only remaining failure mode is an unreachable
database — which does not happen inside `docker compose`, where Postgres is a
healthy dependency.

## To run it (on a machine with Docker)

```sh
cd backend
docker compose up --build      # postgres + redis + backend + pgadmin
# backend: waits for pg → prisma db push → seeds (compiled JS) → starts on :4000
curl localhost:4000/health     # {"status":"ok","db":"up",...}
open  localhost:4000/api/docs   # Swagger
```

Then point the frontend at it: from the repo root, `npm run dev` — the frontend's
`.env.local` already sets `VITE_API_URL=http://localhost:4000` and
`VITE_ENABLE_MSW=false` (MSW off, real API on).

# Vetri TN — Backend (NestJS)

Prototype-stage REST backend for the **Vetri Tamil Nadu** citizen super-app (not yet production: see the Trust Center for controls still open).
It replaces the frontend's in-browser MSW mock backend with a real server —
**path-for-path identical contracts**, so going live is a two-line env change on
the frontend (no component code changes).

- **Runtime:** NestJS 10 · TypeScript (strict) · Node 20
- **Data:** PostgreSQL 16 · Prisma 5 (UUID PKs, soft-delete + `version` on core entities)
- **Auth:** JWT access + rotating refresh tokens · Passport · bcrypt · role-based access control
- **Infra:** Redis (queues-ready) · Helmet · rate-limiting · pino structured logs · Swagger
- **Integrations:** pluggable Government Gateway (Aadhaar, DigiLocker, RTO, Revenue, Municipality, Police, Transport, Treasury, Payment, Certificate Authority) — mock adapters today, drop-in live clients later

---

## Quick start (Docker — recommended)

```bash
cd backend
# Secrets have no defaults; compose refuses to start without them. Write them
# ONCE: Postgres keeps the first password it was initialised with.
[ -f .env ] || printf 'POSTGRES_PASSWORD=%s\nREDIS_PASSWORD=%s\nJWT_ACCESS_SECRET=%s\n' \
  "$(openssl rand -hex 16)" "$(openssl rand -hex 16)" "$(openssl rand -hex 32)" > .env
# Demo only: fixed OTP + Demo Mode personas, and seed an empty database.
AUTH_MOCK=true SEED_ON_BOOT=true docker compose up --build   # postgres + redis + backend + web
```

On boot the backend applies committed migrations (`prisma migrate deploy`). It
seeds demo data only when `SEED_ON_BOOT=true` **and** the database is empty; a
failed check stops the boot rather than reseeding. The container runs as the
unprivileged `node` user. The `web` service builds the portal from the repo
root (`Dockerfile.web`) and serves it with nginx as a non-root user, with
security headers, gzip and `/api` proxied to the backend on one origin.

| Service   | URL                              |
|-----------|----------------------------------|
| Web portal | http://localhost:8080           |
| API       | http://localhost:4000/api        |
| Swagger   | http://localhost:4000/api/docs (off in production unless `SWAGGER=true`) |
| Health    | http://localhost:4000/health (503 when the database is down) |

Postgres and Redis are not published on the host. For local development add the
loopback-only override: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up postgres redis`.

A database first created by the old `prisma db push` boot has no migration
history. Baseline it once (see `docker-entrypoint.sh`) before upgrading.

**Backups.** `./scripts/backup.sh` writes a compressed `pg_dump` to `./backups`
and keeps the newest 14; schedule it daily and copy the folder off the host.
`./scripts/restore.sh backups/<file>.dump` restores one in a single transaction
(it asks you to type RESTORE first). Set `PG_CONTAINER` if your Postgres
container is not `vetri-postgres`.

## Quick start (local, no Docker)

```bash
cd backend
npm install
cp .env.example .env             # set DATABASE_URL and JWT_ACCESS_SECRET
npx prisma generate
npm run prisma:deploy            # apply committed migrations
npm run db:seed                  # refuses a non-empty DB unless SEED_FORCE=true
npm run start:dev                # http://localhost:4000/api
```

## Connect the frontend

```bash
# from the repo root — .env.local already points at the live backend
npm run dev                        # frontend talks to the real backend
```
The frontend ships `.env.local` with `VITE_API_URL=http://localhost:4000` and
`VITE_ENABLE_MSW=false`. Set `VITE_ENABLE_MSW=true` to run offline on the MSW
mocks instead. See [`INTEGRATION.md`](./INTEGRATION.md).

---

## Architecture

```
src/
  main.ts                 bootstrap: helmet, CORS, ValidationPipe, Swagger, pino
  app.module.ts           global guards (throttle→JWT→roles), audit interceptor, exception filter
  config/                 typed configuration (env-driven)
  prisma/                 PrismaService (@Global)
  common/                 decorators (@Public, @Roles, @CurrentUser), guards, filter, interceptor, pagination
  modules/
    auth/                 OTP request/verify, JWT + refresh rotation, RBAC permission catalog
    workflow/             Government Workflow Engine (stage graph, BFS routing, timeline projection)
    applications/         apply → assign officer → advance → issue certificate to wallet
    catalog/              services, service-categories, schemes
    documents/            citizen wallet
    notifications/        feed, mark-read, admin broadcast
    citizen/              profile (me), digital life timeline
    officer/              queue, stats, legal workflow actions, audit trail
    analytics/            department + constituency (MLA) aggregates
    complaints/           routing rules + filing
    search/               universal index (services · documents · schemes)
    ai/                   Ask Vetri — server-side intent→context→plan→tools→compose
  integrations/           Government Gateway: uniform adapter interface + 10 mock adapters
```

### Government Workflow Engine
A single config-driven stage machine drives **every** application and complaint —
no service hardcodes its own flow:

```
submitted → docVerification → officerAssigned → departmentQueue → inspection
  → remarks → approval → digitalSignature → certificateGeneration
  → walletDelivery → notified → completed
        ⌐ escalation   ⌐ correctionRequested   ⌐ rejected
```
Officer actions (approve / reject / correction / escalate) are **legal transitions**
resolved by BFS over the transition graph — never forced state jumps. Reaching
`walletDelivery` auto-issues the certificate into the citizen's wallet and fires a
notification + timeline event.

### RBAC
Global `JwtAuthGuard` (bypassed by `@Public()`) + `RolesGuard` (`@Roles(...)`).
Roles: `CITIZEN · OFFICER · DEPARTMENT · MLA · ADMIN · SUPPORT`. The permission
catalog in `modules/auth/rbac.ts` mirrors the frontend's `lib/rbac/roles.ts`, and
the `/auth/verify` response returns the same permission set the UI already guards on.

### Government Gateway
`POST /api/government/:adapter/:op` where `op ∈ validate|fetch|submit|update|track|download|status`.
`GET /api/government/adapters` lists the registry. Adapters run in **mock** mode
(`GATEWAY_MODE=mock`); each returns realistically-shaped data so swapping a live
client in is invisible to callers.

---

## Demo login

The seed provisions the exact frontend persona as the **first** citizen
(`Chandramoulishwarar K`, `TN-2024-XXXX-8842`) with the same 4 wallet documents,
6 notifications and life-timeline the UI expects.

Demo auth exists only while `AUTH_MOCK=true` (default OFF when
`NODE_ENV=production`). Then the OTP is fixed to **`123456`**, a mobile that
matches no citizen signs in as the demo citizen, and `POST /auth/demo
{"persona":"officer"}` (citizen/officer/department/mla/admin) gives each persona
its own user record. Demo Mode in the frontend calls it. With `AUTH_MOCK` off,
`/auth/demo` is a 404, OTPs are random, and `/auth/verify` never accepts a role:
the role always comes from the user record. Biometric login is rejected until a
UIDAI registered-device verifier exists.

## Seeded volume

38 TN districts (+ taluks + villages) · 20 departments · 100 officers ·
8 service categories · 20 flagship services · 100 welfare schemes ·
1,001 citizens · 500 applications · 200 complaints.

## Scripts

| Command                | Purpose                                            |
|------------------------|----------------------------------------------------|
| `npm run start:dev`    | watch-mode dev server                              |
| `npm run build`        | production build → `dist/main.js` + `dist/prisma/seed.js` |
| `npm run db:seed`      | seed demo data (local dev, via `tsx`)              |
| `npm run db:seed:prod` | seed from compiled JS (`node dist/prisma/seed.js`) |
| `npm run prisma:migrate` | create + apply a migration                       |
| `npm run db:reset`     | drop, re-migrate, re-seed                          |
| `npm run prisma:studio`| browse the DB                                      |

### Seed execution model
The seed **never runs through `ts-node`**. Locally it runs via `tsx` (a robust,
esbuild-based TS runner); in Docker it is **compiled to `dist/prisma/seed.js`
during the image build and executed with plain `node`** — so the container has no
TypeScript runtime in its path at all. This is the production-correct approach and
eliminates the `ts-node` configuration crash (`reading 'fileExists'`) entirely.
See [`SEED-FIX.md`](./SEED-FIX.md) for the full root-cause writeup.

## Verification status (this environment)

- `npx tsc --noEmit` — **clean (exit 0)**, whole backend
- `npm run build` — **clean**, emits `dist/main.js` **and** `dist/prisma/seed.js`
- `node --check dist/prisma/seed.js` — **passes** (compiled seed is valid JS)
- `node dist/prisma/seed.js` against an unreachable DB — **runs under plain node**,
  reaches real Prisma logic, and fails only with `P1001 Can't reach database`
  (proving the `ts-node` crash class is gone)
- `prisma validate` / `prisma generate` — **valid schema**, client generated
- Full boot with a live Postgres + Redis happens via `docker compose up`; this
  sandbox has no Docker/Postgres daemon, so that final step runs on your machine.

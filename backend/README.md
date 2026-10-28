# Vetri TN — Backend (NestJS)

Production-grade REST backend for the **Vetri Tamil Nadu** citizen super-app.
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
cp .env.example .env            # defaults work as-is for local Docker
docker compose up --build       # postgres + redis + backend + pgAdmin
```

On boot the backend waits for Postgres, syncs the schema (`prisma db push`),
seeds realistic TN demo data **if the DB is empty**, then starts.

| Service   | URL                              |
|-----------|----------------------------------|
| API       | http://localhost:4000/api        |
| Swagger   | http://localhost:4000/api/docs   |
| Health    | http://localhost:4000/health     |
| pgAdmin   | http://localhost:5050 (admin@vetri.tn / admin) |
| Postgres  | localhost:5432 (vetri / vetri)   |
| Redis     | localhost:6379                   |

## Quick start (local, no Docker)

```bash
cd backend
npm install
cp .env.example .env             # point DATABASE_URL at your Postgres
npx prisma generate
npx prisma db push               # or: npm run prisma:migrate
npm run db:seed
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
6 notifications and life-timeline the UI expects. OTP is fixed to **`123456`** in
mock mode. Switch personas (officer/department/MLA/admin) by passing `role` to
`/auth/verify` — Demo Mode in the frontend does this automatically.

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

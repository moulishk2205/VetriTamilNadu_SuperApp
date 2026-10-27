# Frontend ↔ Backend Integration Report

The NestJS backend implements **every** route the frontend's MSW mock backend
served, with **identical request/response shapes**. Swapping from mocks to the
real backend is therefore a configuration change only — no component, hook, or
API-layer code changes.

## The swap (frontend)

`src/config/env.ts` is the single seam. The default is now the **live backend**;
MSW is opt-in behind a flag.

| Var | Live backend (default) | Offline mocks |
|-----|------------------------|---------------|
| `VITE_API_URL` | `http://localhost:4000` (→ requests hit `<origin>/api/*`) | — |
| `VITE_ENABLE_MSW` | `false` (unset) | `true` |

The repo ships a ready `.env.local` with the live values:

```bash
# repo root — already configured for the live backend
npm run dev
```

To run fully offline on the in-browser mocks instead, set `VITE_ENABLE_MSW=true`
in `.env.local`. (Legacy `VITE_API_BASE_URL` / `VITE_ENABLE_MOCKS` still work as
overrides/aliases.)

## Contract map (MSW handler → NestJS route)

| Method & path | MSW handler | NestJS controller | Auth |
|---|---|---|---|
| `POST /api/auth/otp/request` | auth.ts | `auth` | public |
| `POST /api/auth/verify` | auth.ts | `auth` | public |
| `POST /api/auth/demo` | auth.ts | `auth` | public, 404 unless `AUTH_MOCK=true` |
| `POST /api/auth/refresh` | auth.ts | `auth` | public |
| `POST /api/auth/logout` | auth.ts | `auth` | bearer |
| `GET  /api/services` | catalog.ts | `catalog` | public |
| `GET  /api/service-categories` | catalog.ts | `catalog` | public |
| `GET  /api/schemes` | catalog.ts | `catalog` | public |
| `GET  /api/applications` | applications.ts | `applications` | citizen |
| `GET  /api/applications/:id` | applications.ts | `applications` | citizen (owner) |
| `POST /api/applications` | applications.ts | `applications` | citizen |
| `POST /api/applications/:id/advance` | applications.ts | `applications` | officer (own jurisdiction) |
| `GET  /api/documents` | documents.ts | `documents` | citizen |
| `GET  /api/documents/:id` | documents.ts | `documents` | citizen (owner) |
| `GET  /api/notifications` | notifications.ts | `notifications` | citizen |
| `PATCH /api/notifications/:id/read` | notifications.ts | `notifications` | citizen (owner) |
| `POST /api/notifications/read-all` | notifications.ts | `notifications` | citizen |
| `POST /api/admin/broadcast` | notifications.ts | `notifications` | admin |
| `GET  /api/citizen/me` | citizen.ts | `citizen` | citizen |
| `PATCH /api/citizen/me` | citizen.ts | `citizen` | citizen |
| `GET  /api/citizen/timeline` | analytics.ts | `citizen` | citizen |
| `GET  /api/officer/queue` | officer.ts | `officer` | officer |
| `GET  /api/officer/stats` | officer.ts | `officer` | officer |
| `POST /api/officer/applications/:id/action` | officer.ts | `officer` | officer |
| `GET  /api/admin/audit` | officer.ts | `officer` | admin/dept |
| `GET  /api/analytics/department` | analytics.ts | `analytics` | officer+ |
| `GET  /api/analytics/constituency` | analytics.ts | `analytics` | mla+ |
| `GET  /api/complaints` | complaints.ts | `complaints` | citizen |
| `POST /api/complaints` | complaints.ts | `complaints` | citizen |
| `GET  /api/search` | search.ts | `search` | bearer |
| `POST /api/ai/chat` | ai.ts | `ai` | bearer |
| `GET  /api/ai/suggestions` | ai.ts | `ai` | bearer |

Additional backend-only surface (not in the mocks, from the spec):
`GET /api/government/adapters`, `POST /api/government/:adapter/:op`, and Swagger at `/api/docs`.

## Shape parity notes

- **Errors** are normalised by `AllExceptionsFilter` to `{ statusCode, message, fieldErrors, path, timestamp }` — the shape the frontend `ApiError` layer already parses.
- **Pagination** uses `{ items, total, page, pageSize }` exactly as the mocks did.
- **Notifications** map DB `Priority` (`HIGH/MEDIUM/LOW`) → UI `high/normal/low` and compute the relative `timeLabel`.
- **Applications** return the full `ApplicationDTO` (referenceNo, status, stage, officer, slaDaysRemaining, timeline[], remarks[]) the tracker renders.
- **AI** replies keep the `{ text, en?, actions[{label,screen,kind}], plan[], intent }` contract; the server-side pipeline computes them from live data (no canned replies).

## What is verified vs. not

**Statically verified in this environment**
- Whole backend type-checks clean (`tsc --noEmit`, exit 0).
- Production build succeeds (`nest build` → `dist/main.js`).
- Prisma schema valid; client generated; seed type-checks clean.

**Requires a running Postgres + Redis (via `docker compose up`)**
- Live HTTP round-trips and the end-to-end citizen journey. This sandbox has no
  Docker/Postgres daemon, so that step is not demonstrated here — it is wired and
  ready, not claimed as executed.

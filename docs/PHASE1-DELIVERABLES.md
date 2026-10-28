# Vetri TN — Phase 1 Deliverables

Phase 1 converted the single-file prototype into a modular, prototype-stage
frontend architecture for a **Digital Governance Platform** — with the UI kept
pixel-identical throughout. 100 source files (77 TS/TSX, 23 migrated JSX
screens), an MSW mock backend across 8 domains, and clean extension points for
every Phase 2/3 module.

Verification at every checkpoint: `tsc --noEmit` clean · `eslint` 0 errors ·
`vite build` green (44 code-split chunks) · UI visually identical · no console
errors.

---

## 1. Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION                                    │
│  App shell (phone frame + global <style> + OfflineBanner)                   │
│  React Router v7 ── AppRouter (lazy routes) ── ProtectedRoute / RoleRoute   │
│  22 feature screens (features/*/pages)   ErrorBoundary   feedback/states    │
└───────────────┬─────────────────────────────────────────┬─────────────────┘
                │ typed hooks only (no direct API/logic)   │ onNav / goBack
                ▼                                           ▼  (useAppNavigation)
┌───────────────────────────────────────────────────────────────────────────┐
│                        FEATURE LAYER (per domain)                           │
│  features/<domain>/{ api · hooks · services · pages }                       │
│  view-adapter hooks → legacy view shapes (UI unchanged)                     │
└───────────────┬───────────────────────────────────────────────────────────┘
                │ feature APIs
                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            ENGINE / DOMAIN LAYER                            │
│  Workflow Engine · Form Engine · Document Engine · Notification Engine      │
│  Search Engine · AI Engine · RBAC · Integration Gateway (adapters)          │
└───────────────┬───────────────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                              PLATFORM LAYER                                  │
│  lib/api (typed client: interceptors · timeout · retry · 401→refresh)       │
│  Zod contracts · normalized ApiError · logger · storage                     │
│  State: Zustand stores (auth · ui · draft · search) + TanStack Query cache  │
└───────────────┬───────────────────────────────────────────────────────────┘
                │ HTTP (config/env.ts → apiBaseUrl)
                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│   MSW mock backend  ── swap: set VITE_API_BASE_URL + VITE_ENABLE_MOCKS=false │
│   → real backend (NestJS) with the SAME contracts                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**Golden rules enforced:** components never call `apiClient` directly (only
feature `api/` do); no business logic in components (routing/mapping live in
services/hooks); one seam (`config/env.ts`) flips mock → live.

---

## 2. Folder Structure

```
src/
  App.tsx  main.tsx                    shell + entry (MSW init, auth bootstrap)
  app/
    providers/{AppProviders, ErrorBoundary}.tsx
    router/{AppRouter, guards, RoleRoute, paths}.ts(x)
  components/
    ui/{index.jsx (primitives), iconRegistry.tsx}
    feedback/{states.tsx, OfflineBanner.tsx}
  config/{env.ts, queryClient.ts}
  hooks/{useUi, useAppNavigation, useOnlineStatus}.ts
  lib/
    api/{client, errors, tokenStore}.ts
    workflow/{types, definitions, engine}.ts     ← Government Workflow Engine
    forms/{types, engine}.ts                      ← Form Engine
    integrations/{types, registry, adapters/mock} ← Integration Gateway
    rbac/roles.ts        logger/logger.ts         i18n/translations.ts
  store/{authStore, uiStore, draftStore, searchHistoryStore}.ts
  types/models/*         12 Zod-first domain models (citizen, application, …)
  features/<domain>/{api, hooks, services, pages}
    auth · citizen · documents · applications · complaints · ai · schemes
    services · notifications · search · emergency · transparency · settings
    support · profile · home · misc
  mocks/{browser, db}.ts  handlers/{auth, documents, notifications, catalog,
        citizen, complaints, search, ai}.ts
  styles/theme.ts        index.css
```

Counts: **77** TS/TSX · **23** migrated JSX screens · **12** domain models ·
**8** MSW handler domains.

---

## 3. Technology Stack

| Concern | Choice | Notes |
|---|---|---|
| Language | **TypeScript** (strict) | new code TS; screens `.tsx`-migrating incrementally |
| Build | **Vite 8** + React 19 | `@` path alias, code-splitting |
| Routing | **react-router-dom v7** | lazy routes, guards, deep-links |
| Client state | **Zustand v5** (+ persist) | auth, ui, draft, search |
| Server state | **TanStack Query v5** | cache, retry, invalidation |
| Contracts | **Zod v4** | schema = type (`z.infer`) + runtime validation |
| Mock backend | **MSW v2** | real HTTP; delete to go live |
| Lint | **eslint + typescript-eslint** | 0 errors |
| Icons | lucide-react | resolved from string names via `iconRegistry` |

---

## 4. API Contract Summary

Base URL `config/env.ts#apiBaseUrl` (default `/api`). All responses Zod-validated.

| Domain | Endpoints |
|---|---|
| Auth | `POST /auth/otp/request` · `POST /auth/verify` · `POST /auth/refresh` · `POST /auth/logout` |
| Citizen | `GET /citizen/me` · `PATCH /citizen/me` |
| Documents | `GET /documents` · `GET /documents/:id` |
| Services | `GET /services` · `GET /service-categories` |
| Schemes | `GET /schemes` |
| Complaints | `POST /complaints` (generates ref + starts workflow) · `GET /complaints` |
| Notifications | `GET /notifications` · `PATCH /notifications/:id/read` · `POST /notifications/read-all` |
| Search | `GET /search?q=` |
| AI | `POST /ai/chat` (intent + navigation action) |

Standard list envelope: `{ items, total, page, pageSize }`. Errors normalize to
`ApiError { kind, status, code, fieldErrors, retryable }`.

---

## 5. Workflow Engine Overview

`lib/workflow` — any service declares a typed `WorkflowDefinition` (ordered
`stages` + `transitions` adjacency list) and the pure engine drives every
instance, so nothing is hardcoded per service. Definitions are TypeScript, not
admin-editable data; an editable BPMN/DMN engine is future work.

Standard government pipeline (`gov.standard.v1`):

```
submitted → docVerification → officerAssigned → departmentQueue → inspection
→ remarks → escalation → approval → digitalSignature → certificateGeneration
→ walletDelivery → notified → completed          (+ rejected / correctionRequested)
```

Engine API: `startWorkflow`, `canTransition`, `applyTransition` (validates legality),
`nextStages`, `progress`, `buildTimeline`, `isComplete`. **Proven live:** complaint
submission starts an instance and generates a real reference number.

---

## 6. Integration Gateway Overview

`lib/integrations` — every external system sits behind a typed adapter interface;
features resolve providers by capability via `gateway.get('digilocker')`. Phase 1
ships **mock adapters** (MSW/stub); going live = `gateway.register(cap, liveAdapter)`
with zero call-site changes.

Capabilities: `digilocker · parivahan · tamilnilam · esevai · tnega · aadhaar ·
pan · sms · email · push · payment`. Base contract exposes `healthCheck()`, so an
Admin portal can render a live/mock provider health board.

---

## 7. Future Portal Readiness

| Portal | Ready via | Missing (Phase 2) |
|---|---|---|
| Citizen | shipped | — |
| Officer | `RoleRoute` + `officer` role/permissions + `/officer` home | portal screens |
| Department | `department` role + `analytics:read` | dashboard screens |
| MLA | `mla` role + transparency models | live data feed |
| Admin | `admin` role + gateway health + audit model | portal screens |

RBAC (`lib/rbac/roles.ts`) already encodes all five roles and their permissions;
`authStore` carries the session's `permissions`; `RoleRoute` gates by permission.
Adding a portal = new routes under a `RoleRoute` + screens. **No auth/routing
rewrite.**

---

## 8. Technical Debt

| Item | Impact | Plan |
|---|---|---|
| 23 screens still `.jsx` (props implicit `any`) | Low — behavior-identical, tsc allows JS | Convert to `.tsx` as each is next touched |
| Per-screen loading/empty states not applied to every screen | Low — global error/offline/route-loading + `AsyncBoundary` ready | Wrap remaining query screens with `AsyncBoundary` |
| Home / Tracker / Personal / Address read inline data | Low — display-only, visually correct | Wire to `useCitizen` / applications API |
| QR renders a verification URL, not a QR image | Low | add a QR lib in Phase 2 (engine method ready) |
| `SplashScreen` useEffect dep warning | Cosmetic | intentional run-once; wrap `onDone` in `useCallback` |
| No automated tests yet | Medium | add Vitest + Playwright in Phase 2 |
| Access token not restored on reload (refresh-token seam only) | Low — MSW ignores auth; guards use persisted flag | real backend + silent-refresh on boot |

---

## 9. Phase 2 Readiness Report

**Ready to build on, no rewrite required:**
- **Real backend:** flip `VITE_API_BASE_URL` + `VITE_ENABLE_MOCKS=false`. Contracts already match; NestJS implements the same routes/DTOs.
- **New government services:** declare a `FormDefinition` (sections/fields/validation/docs) + reuse `gov.standard.v1` (or a custom `WorkflowDefinition`). No new plumbing.
- **Real integrations:** implement an adapter interface, `gateway.register(...)`. DigiLocker/Aadhaar/SMS/Payment slots exist.
- **Real AI:** replace the `/ai/chat` handler with an LLM; the tool-call/navigation contract is in place.
- **Officer/Admin portals:** add routes under `RoleRoute`; RBAC + models exist.
- **Push notifications:** Notification Engine + model (categories/priority/deep-links) ready; add a service worker + `push` adapter.

**Still Phase 2 (by design):** actual service forms, real external APIs (UIDAI/
DigiLocker/DLT-SMS/TNeGA), a running backend, real LLM, QR image rendering, tests.

---

## 10. Capability Confirmation

The Phase 1 architecture supports the following **without architectural rewrites**:

- ✅ **Citizen Portal** — shipped and running.
- ✅ **Officer Portal** — `RoleRoute` + `officer` permissions; add screens.
- ✅ **Department Portal** — `department` role + analytics permission; add screens.
- ✅ **MLA Dashboard** — role + transparency models; add live feed.
- ✅ **Admin Portal** — `admin` role + gateway health + audit-log model.
- ✅ **Government Integrations** — Integration Gateway adapter interfaces (11 capabilities).
- ✅ **Dynamic Government Forms** — Form Engine (config-driven sections/fields/validation/drafts).
- ✅ **AI Workflow Automation** — AI Engine (tool-calling/navigation) × Workflow Engine (generic pipeline).

Each is an **additive** change — new definitions, adapters, roles, or screens —
layered onto the platform, feature, engine, and transport foundations built in
Phase 1.

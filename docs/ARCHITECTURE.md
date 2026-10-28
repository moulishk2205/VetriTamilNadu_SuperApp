# Vetri TN — Phase 1 Architecture & Decision Log

Phase 1 converts the single-file prototype into a modular, prototype-stage
frontend **without changing any pixel of the UI**. This log records the
architectural decisions and technical debt per checkpoint. Final deliverables
(diagram, folder tree, dependencies, production-readiness) are at the end,
completed in CP6.

---

## Decision index

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **TypeScript (strict)**, incremental | Spec demands typed contracts; migrate new code first, screens as touched |
| D2 | **Zustand** for client state, **TanStack Query** for server state | Two different concerns; avoids one bloated store; minimal boilerplate |
| D3 | **MSW** as the mock backend | App makes real HTTP; going live = base-URL change + disable MSW |
| D4 | **React Router** + `useAppNavigation` adapter | Real URLs/history/deep-links while preserving `onNav()/goBack()` call sites |
| D5 | **Zod schema = source of truth**; types via `z.infer` | One definition is both compile-time type and runtime contract |
| D6 | **View-adapter hooks** map domain models → legacy view shapes | Screens stay byte-identical; no business logic in components |
| D7 | **Single seam** `config/env.ts` (`apiBaseUrl`, `enableMocks`) | NestJS swap = env change only |
| D8 | Icons/colors stored as **string keys** in data, resolved in view layer | Backend-friendly JSON; `iconRegistry` + palette resolve at render |

---

## CP0 — Tooling & scaffold
- Added TS, `tsconfig` (strict, `allowJs` for incremental migration, `@/*` alias), `vite.config.ts`.
- Deps: react-router-dom, zustand, @tanstack/react-query, zod (runtime); typescript, msw, typescript-eslint, @types/node (dev).
- MSW worker installed (`public/mockServiceWorker.js`), `enableMocking()` gated to dev.
- `AppProviders` (QueryClientProvider), `main.tsx` entry, bridge `App.tsx` still rendering the prototype verbatim.
- **Verified:** tsc clean, build green, UI unchanged.

## CP1 — Foundation extraction
- Extracted `styles/theme.ts` (colors + CSS **verbatim**), `lib/i18n/translations.ts`, `store/uiStore.ts` (Zustand + `persist`), `hooks/useUi.ts` (`useApp/useT/useC` — same shapes, now store-backed).
- Removed the inline theme/context block from the monolith; `App()` reads settings from the store.
- **Value:** theme/language/text-size/contrast now **persist across reloads** (was in-memory only).
- **Verified:** dark mode survives reload (proven), tsc/build clean, screens identical.

## CP2 — Real routing
- Monolith (1×144 KB) → **23 modular files**: primitives in `components/ui/`, 22 screens under `features/*/pages/` (carved verbatim, imports auto-generated).
- `app/router/AppRouter.tsx` with **lazy** routes (43 code-split chunks), `ProtectedRoute` guard, `paths.ts` key→path map, `useAppNavigation` adapter, on-brand 404.
- `store/authStore.ts` stub flag (seam for CP4). `App.tsx` = shell + `BrowserRouter`. Monolith deleted.
- **Verified:** guard redirect, login→`/home`, real URLs, browser back, deep-link `/tracker`, 404, all screens render.

## CP3 — Data plane
- **`lib/api/client.ts`**: typed `fetch` client — request/response interceptor registry, auth-header injection, `AbortController` timeout, retry w/ exponential backoff (idempotent by default), **401 → token-refresh → retry**, Zod response validation, all failures normalized to `ApiError`.
- **`lib/api/errors.ts`**: `ApiError` with stable `kind` (offline/timeout/unauthorized/validation/…); `normalizeError` + `errorFromResponse`.
- **`lib/logger/logger.ts`**: scoped structured logger + ring buffer (Phase-2 remote-sink seam).
- **`types/models/*`**: DB-ready Zod models — citizen, application (full lifecycle enum), document, complaint, department/officer, notification, scheme, service, session/device/token-pair, conversation, certificate, payment, audit-log, search, transparency.
- **`mocks/db.ts` + `mocks/handlers/*`**: MSW backend seeded verbatim from the prototype's arrays (documents, notifications, services, categories, schemes, citizen).
- **Feature APIs + hooks** (documents, notifications, services, schemes): api module → Zod-validated fetch → TanStack Query → view-adapter hook returning the legacy shape.
- **Wired 4 screens** (DigitalWallet, NotificationsScreen, ServicesHub, SchemeDiscovery) via one-line data-source swap; JSX untouched.
- **Verified:** `GET /api/documents → 200` from MSW; all 4 screens render identically; tsc clean; build green; no console errors.

---

## Technical debt (tracked, to be paid down)

| Item | Where | Planned |
|------|-------|---------|
| Screens are still `.jsx` (props implicit `any`) | `features/*/pages/*.jsx` | Convert to `.tsx` incrementally as each is touched (CP4/CP5/CP6) |
| Loading/empty/error/offline states not yet on screens | wired screens | **CP6** — `AsyncBoundary` wrapping (hooks already expose status) |
| Remaining screens read inline data | Home, Tracker, Complaint, AI, Emergency, MLA, District, Personal, Address, Security, Help | Wired in **CP4** (citizen) / **CP5** (engines) |
| `authStore` is a stub boolean | `store/authStore.ts` | **CP4** — real tokens/session/refresh |
| Suspense fallback is a blank div | `AppRouter` | **CP6** — themed splash/skeleton |
| `src/App.css` unused (dead) | `src/App.css` | **CP6** — remove |
| Stray comment in primitives module | `components/ui/index.jsx` | **CP6** — cleanup |

---

## CP4 — Authentication
- `lib/api/tokenStore.ts` (in-memory access token + refresh delegate, avoids circular dep with the store).
- `features/auth/api/authApi.ts` + `mocks/handlers/auth.ts`: OTP request/verify, refresh, logout (production-shaped; any 6-digit OTP accepted in mock).
- `store/authStore.ts` rewritten: real session (access+refresh tokens), signed-in citizen, RBAC `permissions`, `login/logout/bootstrap`, wires `tokenStore` refresh handler.
- `features/auth/hooks/useAuth.ts`; LoginScreen routes OTP/biometric through `login()`; ProfileScreen "Log Out" now invalidates + clears + redirects.
- **Verified live:** biometric + OTP round-trips, session persistence across reload, refresh endpoint, logout clears session, protected-route redirect. **Audit fact #4 (dead logout) fixed.**

## CP5 — Reusable engines (platform vision)
- **Integration Gateway** (`lib/integrations`): 11 typed adapter interfaces + mock adapters + swappable `gateway` registry with `healthAll()`.
- **Workflow Engine** (`lib/workflow`): generic config-driven definition/engine + `gov.standard.v1` full pipeline. Complaint submission is the first consumer.
- **Form Engine** (`lib/forms`) + `store/draftStore.ts`: config-driven forms, Zod schema builder, conditional visibility, persisted drafts.
- **Document Engine** (`features/documents/services`): download/share/QR/DigiLocker-refresh — wallet buttons wired.
- **AI Engine** (`features/ai`): intent-matched chat + navigation actions — AIAssistant wired.
- **Search Engine** (`features/search` + store): index + recent searches.
- **RBAC** (`lib/rbac`) + `app/router/RoleRoute.tsx`: 5 roles, permission catalog, permission-aware guard for future portals.
- **Verified live:** AI intent reply + Track action; complaint submit generated **CMP-TN-2026-000453** (audit fact #6 fixed); search endpoint; document actions.

## CP6 — Hardening
- `components/feedback/{states.tsx (Loading/Empty/Error/AsyncBoundary), OfflineBanner.tsx}`, `hooks/useOnlineStatus.ts`, `app/providers/ErrorBoundary.tsx` (logs via structured logger).
- Wired: ErrorBoundary in provider stack, OfflineBanner in shell, themed route-loading Suspense fallback, ProtectedRoute unauthorized redirect.
- Cleanup: removed dead `App.css`, stray primitives comment; fixed all unused imports from the carve; added typescript-eslint (0 errors).
- **Verified:** offline banner reactive (appears/clears), home pixel-identical, `tsc` clean, `eslint` 0 errors, `vite build` green (44 chunks).

See `PHASE1-DELIVERABLES.md` for the full architecture diagram, contracts, engine/gateway overviews, portal readiness, and Phase 2 report.

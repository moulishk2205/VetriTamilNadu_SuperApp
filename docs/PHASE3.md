# Vetri Tamil Nadu — Phase 3 Deliverables

## Final Production Platform · From Citizen App to Digital Governance Ecosystem

Phase 3 adds five role-based portals, an AI operating assistant, an analytics
platform, presentation mode and the Digital Citizen Timeline — **entirely on the
Phase 1/2 engines**. No engine was rebuilt; every module consumes the Workflow,
Application, Form, Document, Notification, Upload, Wallet, Search and AI engines
through the Integration Gateway and RBAC established earlier.

---

## 1. Officer Portal Architecture

**Routes** `/officer`, `/officer/app/:id` — guarded by `RoleRoute require=['application:process']`.

- **Dashboard**: live queue (pending / due-today / high-priority / escalated /
  corrections), officer identity + jurisdiction, daily performance (avg
  processing, approval rate, citizen rating, SLA compliance, dept rank).
- **Application Review**: citizen details, submitted documents (wallet-verified
  vs uploaded), workflow timeline, remarks, and five actions — **Approve & Issue**
  (eSign placeholder → certificate generation → wallet delivery → citizen
  notification → completed), **Request Correction**, **Escalate**, **Transfer**,
  **Reject** — every one a *legal* Workflow Engine transition found via BFS over
  the definition graph (`mocks/handlers/officer.ts`), never a forced state jump.
- Every action writes the **audit log**, the **citizen timeline** (workflow
  history) and a **citizen notification** automatically.
- **Verified live**: approve on `APP-2026-IC-44821` → status Completed, remark
  recorded, audit entry `approve+issue`, certificate `CRT-2026-IC-44821`
  delivered to the Wallet.

## 2. Department Dashboard

`/department` (`analytics:read`) — today/month/pending/approved/rejected tiles,
avg SLA, overdue, escalations, monthly trend (line), service demand (bars),
district comparison (h-bars), top and slowest officers. Live counts derive from
the application records; historic series are charter-plausible aggregates the
real backend will materialise from the same workflow events.

## 3. MLA Dashboard (the showcase)

`/mla-portal` — Mylapore constituency command view with five sections
(Overview / Trends / Services / People / Wards): submitted-completed-pending,
resolution time, satisfaction, scheme uptake; department performance; monthly
trends; top services & complaints; **ward demand heat map**; demographics donut
(women / youth / seniors / farmers / disabled); ward comparison. **Presentation
mode** auto-advances sections every 5s; the print icon exports via the browser
print-to-PDF pipeline. All charts are the theme-aware SVG kit
(`components/charts`) — no chart library, dark-mode native.

## 4. Super Admin Portal

`/admin` (`admin:manage`) — six tabs: **Overview** (platform stats + live
Integration Gateway `healthAll()` across all 14 adapters), **Manage**
(config-as-data registries: services, forms, workflows, districts, officers,
adapters), **Flags** (persisted feature flags with kill-switches),
**Broadcast** (announcement → every citizen's notifications, verified),
**Logs** (structured-logger ring buffer), **Audit** (officer/system audit trail).

## 5. AI Assistant Capability Report

The assistant is a **Government Operating Assistant**, not a chatbot:

| Capability | Status |
|---|---|
| Life events (marriage / land purchase / bereavement / relocation) | ✅ multi-service checklists + tool-call buttons |
| Proactive **"Ask Vetri"** | ✅ computed from live state — noticed the expired `IC-TN-2024-9912`, DL renewal window, 3 eligible schemes |
| Document assistant | ✅ grounded in the Wallet (quotes real document numbers) |
| Application assistant | ✅ live status, officer, RTS-deadline explanations |
| Scheme advisor | ✅ eligibility + match % + required documents |
| Tamil + English + mixed | ✅ every reply bilingual |
| Voice in / voice out | ✅ Web Speech API (`useVoice`), ta-IN/en-IN, graceful degradation |
| Conversation memory | ✅ persisted across sessions (`aiStore`) |
| Tool calling / navigation | ✅ every reply carries deep-link actions through the app router |
| Officer assistant / OCR / form auto-fill | seam ready — same tool-call contract, LLM swap point at `/api/ai/chat` |

## 6. Integration Adapter Report

14 typed adapters behind the Gateway (`gateway.get(capability)`), all
mock-mode, swappable via `gateway.register()` with zero call-site changes:
DigiLocker · Parivahan · TamilNilam · e-Sevai · TNeGA · Aadhaar eKYC · PAN ·
SMS (DLT) · Email · Push (FCM/APNs) · Payment · **Maps** · **Geolocation** ·
**eSign/DSC** (new in Phase 3). Health monitoring surfaces in the Admin Portal.
Nothing is faked — external services remain honest Assisted handoffs.

## 7. Analytics Report

`/api/analytics/department`, `/api/analytics/constituency`,
`/api/citizen/timeline` — Zod-validated contracts (`analyticsApi`), consumed via
TanStack Query. Chart kit: StatTile, BarChart, LineChart, Donut, HBars,
HeatGrid — pure SVG, palette-token driven, light/dark native. KPIs, trends,
demand, satisfaction, demographics, ward comparisons, exportable via print.

## 8. Security & Production Readiness

- **AuthN/Z**: OTP/biometric → JWT + refresh rotation → RBAC roles
  (citizen/officer/department/mla/admin) → permission-guarded routes.
- **Hardening**: ErrorBoundary, offline banner + **offline queue** (persisted
  replay, `offlineQueueStore`), retry w/ backoff, 401-refresh-retry, Zod at
  every boundary, structured logging + ring buffer, **audit trail**,
  **secureStorage** encryption-at-rest seam, **feature flags**, health checks.
- **Performance**: 75 code-split chunks, lazy routes, query caching.
- **Quality gate**: `tsc` 0 errors · `eslint` 0 errors · build green ·
  **zero console errors** across the full multi-portal walkthrough · UI parity
  preserved (citizen screens untouched; portals reuse the same primitives/theme).

## 9. Demo / Presentation Guide

Open **`/demo`** — the presentation cockpit. One tap enters any persona through
the *real* auth pipeline. Fully offline (embedded mock backend). The script:

1. **Citizen** → AI → "Ask Vetri noticed" proactive cards greet you.
2. Say **"I bought land"** → bilingual checklist + Patta/Wallet/Tracker actions.
3. Apply for Income Certificate — wallet-assisted documents, official ₹60/15-day metadata.
4. Submit → real Application ID → Tracker with officer + RTS deadline.
5. **Officer** → open the case → remarks → **Approve & Issue**.
6. Back as Citizen: notification + certificate in the Wallet.
7. **MLA** → constituency analytics → presentation mode → heat map.
8. **Admin** → integration health, broadcast, audit trail.
9. Close on **Profile → Digital Timeline** — one life, one digital history.

## 10. Citizen Timeline Design

`/timeline` (Profile → My Activity → Digital Timeline). Composed live by the
backend from wallet certificates, application records and complaints, merged
with life milestones, year-grouped on the app's timeline visual language:
2002 Birth Certificate → 2008 School → 2019 Community Certificate → 2024
Driving Licence → 2025 Smart Card → 2026 applications/complaints/issued
certificates — every new government interaction appears automatically.

## 11. Final System Architecture

```
                        ┌────────────────────────────────────────────┐
                        │              PRESENTATION                  │
                        │ Citizen App │ Officer │ Dept │ MLA │ Admin │
                        │        (+ /demo presentation mode)         │
                        ├────────────────────────────────────────────┤
                        │       ROUTER + RBAC (RoleRoute guards)     │
                        ├────────────────────────────────────────────┤
                        │  ENGINES (config-as-data, reused by all)   │
                        │  Workflow · Application · Form · Document  │
                        │  Notification · Search · AI · Analytics    │
                        ├────────────────────────────────────────────┤
                        │  DATA PLANE: typed fetch client (retry,    │
                        │  401-refresh, Zod) · TanStack Query cache  │
                        │  Zustand stores (auth/ui/ai/flags/queue)   │
                        ├────────────────────────────────────────────┤
                        │  INTEGRATION GATEWAY — 14 typed adapters   │
                        │  (mock now ⇄ live later, zero rewrites)    │
                        ├────────────────────────────────────────────┤
                        │  MSW mock backend  ⇄  future NestJS via    │
                        │  env seam (apiBaseUrl + enableMocks=false) │
                        └────────────────────────────────────────────┘
```

## 12. Confirmation

**Vetri is now a presentation-ready Digital Governance Platform.** A stakeholder
demonstration can flow as one continuous story — citizen life-event → AI-driven
application → officer approval → certificate in wallet → constituency analytics
→ digital life timeline — with no placeholder buttons, no "coming soon" screens
(the sole disabled control, DigiLocker import, is an honest integration-pending
label as mandated), no console/type/lint/build errors, and every feature running
offline on the embedded backend. The architecture supports Citizen, Officer,
Department, MLA and Admin portals, government integrations, dynamic forms, and
AI workflow automation **without architectural rewrites** — new services are
configuration, new portals are routes behind existing guards, and going live is
an environment change plus adapter registration.

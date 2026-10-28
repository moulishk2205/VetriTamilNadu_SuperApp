# VETRI vs TNeGA e-Sevai 2.0 BPM EOI: readiness report

**EOI:** TNeGA/EOI/e-Sevai 2.0/2026-2027, dated 23.10.2026. It is the BPM and workflow-orchestration platform for the "Vetri Tamil Nadu Integrated e-Sevai 2.0 Platform".
**Deadline:** **3 Nov 2026, 16:00**, e-submission on tntenders.gov.in only, signed with a DSC.
**Prepared:** 27 Oct 2026.
**Method:** the working tree was read statically and checked against every requirement in the EOI. Seven assessors each covered one requirement group. Then one adversarial verifier per group tried to refute every "Yes" and "Partly" and re-searched every "No". The licensing research was done on the web, with sources. Nothing was executed: this machine has no Docker or Postgres.

> Why so strict: under **Clause 9.5**, a response with false or misleading information can be disregarded. Every rating below is the **post-verification** rating. Where two verifiers disagreed, the lower rating was kept.

---

## 1. Bottom line

1. **VETRI is a citizen-services app. The EOI asks for a configurable BPM engine.** e-Sevai 2.0 wants a platform where TNeGA admins *configure* every service without code: forms, BPMN workflow, DMN rules, approval chain (up to 10 levels), fees, notifications and certificate templates. In VETRI each of these is a TypeScript constant or seed data. The "Government Workflow Engine" is one hardcoded 15-stage state machine (`backend/src/modules/workflow/workflow.engine.ts:21-55`). The `Workflow`/`WorkflowStep` tables are seeded but never read.
2. **Format 6 (21 capabilities): 0 Yes, 9 Partly, 12 No.** Items 1–7 are the BPMN/DMN core and the main subject of the EOI. All seven are **No**.
3. **Clause 5.2 Key Expectations: 0 Met, 7 Partly, 2 Not met.** The two misses are (c) BPMN/DMN open standards and (f) configuration-first.
4. **DPI connectors: 0 of 18 live.** Five have mock adapters that return canned data. No business flow calls them.
5. **The bigger blockers are not about code.** Clause 5.3 requires **at least two live deployments** of the proposed solution, with a client referral. Clause 6(b) requires an **Indian registered legal entity**. You also need a **DSC** and a **tntenders.gov.in** registration.
6. **Critical security defect, fix it whatever you decide** (§2). Anyone can get an ADMIN token without an OTP.

**Recommendation:** do **not** present VETRI as "the platform". You have three realistic options (§9):
- **(A)** Join an established SI or OEM respondent and contribute VETRI as the citizen-experience layer. This is the best option if you lack the entity or the live deployments.
- **(B)** Respond yourselves as a start-up (Clause 6a allows this) on **Solution Route A**: Operaton BPMN/DMN plus bpmn-js, with VETRI as the accelerator. Be fully honest in Formats 5 and 6 and accept the Clause 5.3 gap.
- **(C)** Skip this EOI and build towards the RFP.

Because the EOI is unscored (Cl. 7.1c), (B) costs little if the eligibility documents exist. Note Cl. 9.2: TNeGA may use your ideas without attribution.

---

## 2. Fix before anyone sees a demo

| # | Defect | Where | Effect |
|---|---|---|---|
| 1 | **Authentication bypass.** `POST /api/auth/verify` is `@Public`. It takes the caller's `role`, and it skips the OTP check whenever `method:"biometric"`, or when `otp`/`identifier` is omitted, or when no OTP row exists. Nothing limits this to mock mode. | `backend/src/modules/auth/auth.service.ts:44-57`, `auth.dto.ts:13-17`, `auth.controller.ts:19-23` | `{"method":"biometric","role":"admin"}` returns an ADMIN token. Every RBAC guard is moot. |
| 2 | Every login binds to the first seeded citizen | `auth.service.ts:60` | No real identity. The audit trail's actor field is meaningless. |
| 3 | Fixed OTP `123456` with no SMS sent | `auth.service.ts:28` | Fine as a demo, but it must never ship. |
| 4 | **Role drift through refresh.** There is one User row, and its role is overwritten on every login. | `auth.service.ts:65-67, 85-91`; `User.citizenId @unique` | After anyone uses `/demo`, a *citizen's* refresh token returns an **ADMIN** access token. |
| 5 | **Citizens can self-approve.** `POST /applications/:id/advance` has no `@Roles`. It walks through approval and digital signature, then issues a `verified` certificate. | `applications.controller.ts:28-31`, `applications.service.ts:101-103,119-131`. The UI button is "Check for updates" (`ServiceTracker.jsx:88-89`) | A citizen gets a "verified" certificate in about 9 clicks. |
| 6 | **Full Aadhaar number stored in plaintext** as `Otp.identifier`, never purged | `LoginScreen.jsx:41` → `auth.service.ts:31` → `schema.prisma:147` | Aadhaar Act / UIDAI violation. It also contradicts the UI's "never stores your Aadhaar" copy. |
| 7 | IDOR: any user can read any document (name, date of birth, document number), and any notification | `documents.service.ts:24-27`, `notifications.service.ts:45-52` | — |
| 8 | Boot runs `prisma db push --accept-data-loss`. If the citizen-count query *fails*, the seed runs and **wipes every table, including AuditLog** | `backend/docker-entrypoint.sh:7,16-19`, `seed.ts:88-99` | A temporary DB error at boot can erase the database. |
| 9 | Default secrets (`vetri`/`vetri`, `change-me-access`, code fallback `dev-access-secret`). Postgres, Redis (no password) and pgAdmin (no login) are published on the host. The container runs as root. Node 20 is EOL. | `docker-compose.yml:8,10-11,24-25,45,48-49,68-72`; `configuration.ts:25-26`; `Dockerfile:2,14-31` | Would fail CERT-In VAPT immediately. |
| 10 | **Voice sends citizen data off-platform.** The browser's SpeechRecognition streams audio to Google, Microsoft or Apple, and TTS reads out replies that contain names and document numbers. | `useVoice.ts:23,42,52,60-65`, `AIAssistant.jsx:23` | Breaks Cl. 4.2(c) and 5.2(g) ("citizen data shall not leave"). |

None of these is behind a mock or demo flag. Compose sets `NODE_ENV: production`, and the frontend talks to the live backend by default. Other confirmed issues:
- Swagger is public in every environment (`main.ts:29-35`).
- Raw error messages are returned to clients (`all-exceptions.filter.ts:29-31`).
- Refresh tokens are stored in plaintext.
- `User.active` is never checked.
- There is no CSP.
- The citizen's PII is persisted in localStorage (`authStore.ts:95-101`), which is a problem on shared e-Sevai kiosk browsers.
- Any officer sees and can act on the **statewide** queue (`officer.service.ts:25-30,50-51`).

**Remove or fix copy that overclaims.** Repeating any of these in a submission or presentation would be a Clause 9.5 risk:

- `src/features/admin/pages/AdminPortal.tsx:128` says "Every registry is data, not code … added by configuration". This is false.
- `src/lib/workflow/types.ts:4` and `docs/PHASE1-DELIVERABLES.md:134` say "workflows are data, not code". This is false at runtime.
- `backend/README.md:3`, `docs/ARCHITECTURE.md:3` and `docs/PHASE1-DELIVERABLES.md:3` say "Production-grade".
- `docs/PHASE3.md:71` says "every reply bilingual". Live AI replies are English.
- `src/features/profile/pages/DesktopProfile.tsx:179,187` says "Encrypted" and "shared only when you explicitly authorise it". There is no consent machinery.
- `src/features/admin/pages/AdminPortal.tsx:108` says "Encrypted-at-rest seam". There is no encryption at rest.
- Department, MLA and transparency dashboards show **hard-coded figures** (`backend/src/modules/analytics/analytics.service.ts:31-89`). Label them illustrative or replace them.
- The fee step implies payment is recorded, but no payment data is submitted (`src/features/services/pages/DesktopServiceFlow.tsx:146-148, 507-508`).
- **The prototype presents itself as an official government portal.** "© Government of Tamil Nadu. All rights reserved." (`DesktopFooter.tsx:47`) and "Official Citizen Services Portal" (`translations.ts:53`). Remove these before showing it to TNeGA.
- Hard-coded stats served as live:
  - "Uptime 99.9%" (`AdminPortal.tsx:90`).
  - Officer KPIs `completedThisMonth 47`, `approvalRate 92`, `slaCompliance 96` (`officer.service.ts:45-46`).
  - "Backup / DR: Config-as-data" (`AdminPortal.tsx:109`).
- Other copy that overclaims:
  - "never stores your Aadhaar" and "session encrypted" (`DesktopProfile.tsx:177-187`, `loginCopy.ts:85`, `DesktopHelp.tsx:16`).
  - "real auth pipeline … exactly what production would" (`DemoMode.tsx:12-15,66`). This page *is* the bypass.
  - "genuine … no canned-reply switch" (`ai.service.ts:8-12`). It is a regex switch.
  - "offline queue" and "encryption-at-rest seam" (`docs/PHASE3.md:98-101`). Both are dead code.
- The seeded "Vetri …" schemes with crore budgets (`seed.ts:72-77`) are not verified, so don't quote them as real.

---

## 3. Format 6: Capability Checklist (ready to paste, honest)

| # | Capability | Yes / Partly / No | Remark (evidence) |
|---|---|---|---|
| 1 | Browser BPMN 2.0 modeller for admins | **No** | No modeller. The single workflow is a hardcoded TS state machine (`workflow.engine.ts:21-55`). Proposed: bpmn-js on Operaton. |
| 2 | Approval chain 1–10 levels, sequential or parallel, return to an earlier level | **No** | Only a single officer action. "approve" jumps any stage straight to completed (`officer.service.ts:59-61`, `applications.service.ts:83-89`). |
| 3 | Routing to post and jurisdiction, not a named individual | **No** | Auto-assigns a *named* officer by district and least load (`applications.service.ts:94-116`). The worklist ignores it. |
| 4 | SLA per level, reminders, escalation on breach | **No** | Three display-only `slaDays` constants (`workflow.engine.ts:23,26,29`). `slaDeadline` is never written, `backend/src/jobs` is empty and BullMQ is unused. |
| 5 | Process versioning and migration of in-flight applications | **No** | The version fields are labels only. |
| 6 | DMN decision tables with import/export | **No** | No DMN. Complaint routing is if/else in code, and `EligibilityRule` is seeded but never evaluated. |
| 7 | Plain-language rule builder (eligibility, fees, checklist) | **No** | Rules are catalogue constants. |
| 8 | Rule versions effective by date | **No** | — |
| 9 | Drag-and-drop form builder, Tamil and English | **No** | A real schema-driven *renderer* exists (`src/lib/forms/engine.ts:51-73`), but forms are TS constants compiled into the build. There is no builder, and labels are English-only. |
| 10 | Officer worklist: approve, reject, return, forward, seek report | **Partly** | Approve, reject, correction, escalate and transfer persist with audit and notification. There is no "forward" along a chain and no "seek report". The worklist is not scoped to the logged-in officer. |
| 11 | e-Sign / DSC on approval, incl. bulk | **No** | Only an uncalled mock CA adapter. |
| 12 | Delegation, leave, FAC handover | **No** | — |
| 13 | REST/SOAP connectors with retry | **Partly** | A uniform adapter interface and registry (`backend/src/integrations`), but all 10 adapters are mocks. No HTTP/SOAP client, no retry, and no workflow step calls them. |
| 14 | Published OpenAPI for web, mobile and messenger | **Partly** | Swagger at `/api/docs`. Response schemas are incomplete, and there is no versioning and no partner/channel auth. |
| 15 | On-prem containers; BPMN/DMN export | **Partly** | Backend Dockerfile and compose exist. No frontend image, no K8s/IaC, nothing BPMN/DMN to export. |
| 16 | Responsive screens: citizens, operators, officers | **Partly** | Citizen mobile shell and desktop portal. Officer pages are phone-width. **No operator / e-Sevai-centre persona.** |
| 17 | Native Android/iOS support via SDK/API | **Partly** | A REST + JWT API a native app could consume. No SDK, no push (FCM/APNs), no API versioning. |
| 18 | Reports configurable without coding | **No** | — |
| 19 | Analytics and dashboards | **Partly** | Role-guarded endpoints and screens exist, but most figures are hard-coded (`analytics.service.ts:31-89`). Only a few counts are live. |
| 20 | API gateway | **Partly** | In-app throttling, JWT and request logs only. No gateway, service registry, per-consumer keys or metrics. |
| 21 | Role-based IAM across modules | **Partly** | A role guard and permission catalogue exist, but identity isn't bound to role (§2 #1). No user/role admin. |

---

## 4. Clause 5.2: Key Expectations (Format 5, Part B)

| Clause | Expectation | Position | Remarks |
|---|---|---|---|
| 5.2 a | No recurring licence fee | **Partly** | Every dependency is permissive OSS (MIT/ISC/Apache), and there are no paid SaaS keys. Gaps: no SBOM or licence declaration; the `redis:7-alpine` image likely resolves to Redis 7.4+, which is RSAL/SSPL, so switch to **Valkey** (BSD-3); the build docs assume Docker Desktop, which may need a per-user subscription at TNeGA's size. |
| 5.2 b | Licence, versions, updates (≤ n-2) | **Partly** | Licences are fine. Versions: `@nestjs/swagger` 7 is **beyond n-2**. NestJS 10, Prisma 5, backend TypeScript 5 and Postgres 16 sit **at the n-2 limit** and tip over as soon as Prisma 8 or PG 19 go GA. The Node 20 base image is EOL. There is no component register. |
| 5.2 c | BPMN 2.0 / DMN XML; open formats | **Not met** | No BPMN or DMN anywhere. Forms and configs have no documented open schema or export. |
| 5.2 d | Source code and independent build | **Partly** | Full source, Dockerfile, compose and docs exist. Missing: CI/CD, IaC and automated tests. There are two conflicting lockfiles per project (npm and pnpm). |
| 5.2 e | Ownership / IPR | **Partly** | The code is bespoke, but there is no LICENSE or IPR-vesting statement and no NOTICE file. There is no provenance for the **CM portrait, State emblem and constituency boundary data**. Fonts are loaded from Google at runtime. |
| 5.2 f | Configuration first (forms, workflows, approval chains, rules, fees, notifications, certificate templates) | **Not met** | None of the 7 is admin-configurable. Admins can only broadcast messages and toggle browser-local flags. |
| 5.2 g | On-prem and sovereign, incl. AI | **Partly** | The backend is self-hostable with no vendor SaaS. But Google Fonts load at runtime, **voice input uses the browser's speech recognition, which sends audio to the browser vendor's cloud**, and Prisma downloads binaries and sends telemetry. The "AI" is regex matching, so there is no AI stack to host. |
| 5.2 h | OpenAPI, OIDC/OAuth 2.0/SAML, API-first, multi-tenant | **Partly** | Partial OpenAPI. **No OIDC, OAuth 2.0 or SAML.** No multi-tenancy. |
| 5.2 i | Mobile-first | **Partly** | The citizen mobile shell is real and renders all 21 catalogue forms. The mobile shell has dead or mock screens (non-functional SOS, untappable helplines, fake 9:41 status bar). No PWA or offline support. |

---

## 5. Annexure I, Table 1: 15 scope components

| # | Component | Rating | What exists / main gap |
|---|---|---|---|
| 1 | Core platform | Partly | Good two-shell React UI, component library, live citizen dashboard, NestJS monolith with Swagger. **Missing:** BPMN/DMN engine, form builder, template engine, API gateway, service registry, microservices. |
| 2 | Identity (CAN, SSO, de-dup, Aadhaar and ration-card linkage) | **No** | CAN is a seeded string. Login issues any role to anyone (§2). No SSO, CAN lifecycle or de-duplication. |
| 3 | AI/ML layer (Tamil NLP, document AI, semantic search, officer workbench, voice, grievance AI) | **No** | Regex keyword chat over DB rows. Browser speech runs on the vendor's cloud. No models. |
| 4 | Service onboarding at scale (275 to 1,000 services) | Partly | Metadata-driven rendering exists, but each service needs code in **two** catalogues (21 frontend vs 20 backend, already out of sync) plus a redeploy and reseed. |
| 5 | ~15 departmental portal integrations | Partly | Six mock departmental adapters behind an uncalled generic endpoint. |
| 6 | National and State DPI | Partly | Mock adapter stubs only (see §6). |
| 7 | "No Application" delivery | **No** | Only profile and draft prefill in the browser. No pull from Government databases, no eligibility triggers. |
| 8 | Beneficiary management and scheme registry | Partly | Read-only seeded scheme registry (9 schemes). No eligibility evaluation or beneficiary lists. |
| 9 | e-Sevai centre operations | **No** | UI copy only. No centre registry, operator login or assisted filing. |
| 10 | Grievance and IIPGCMS | Partly | Complaint intake with hardcoded routing. Status never moves past "submitted". No IIPGCMS. |
| 11 | Analytics | **No** | Dashboards run essentially on fabricated constants. |
| 12 | Channel readiness (mobile, messenger, UMANG, IVRS, call centre) | Partly | Swagger REST only. No channel adapters and no partner auth. |
| 13 | Legacy data migration (~110 TB) | **No** | No ETL and no object storage at all. |
| 14 | Deployment on TNeGA infrastructure | Partly | Single-host compose. No HA, IaC, CI/CD, backups or DR. |
| 15 | Compliance (STQC, VAPT, DPDPA, GIGW, UX4G, WCAG) | **No** | Baseline hygiene only. See §7. |

The verifiers also flagged that **payments** are not covered anywhere: the `Payment` model (`schema.prisma:483-495`) is never written. **Monitoring and change management of live services** does not exist either.

---

## 6. Annexure I, Table 2: 18 DPI connectors

**Live: 0 of 18.** Mock adapters only (Partly): **Aadhaar/e-KYC, e-Sign, DigiLocker, Payments, Communication APIs.** Communications is the one with real substance: an in-app notification feed. SMS, email and push are log-only mocks in the frontend.
**Nothing at all (No):** Meri Pehchaan / TN SSO, SFDB, API Setu, Nambikkai Inaiyam, IIPGCMS, e-Courts, CCTNS, UMANG, CSC-SPV, LGD, e-Taal / State Portal, OGD and TNGIS.

- **CCTNS:** the only police adapter is a generic "e-Challan / Verification" stub that returns the same constant for every operation.
- **Geography:** stored as free-text names, not LGD codes.
- **Tier A** (Aadhaar AUA/KUA via an ASA, an ESP for e-Sign, DigiLocker partner onboarding, PayGov, SFDB) needs a **legal entity, audits and Government approvals**. No code change can deliver these.

---

## 7. Guiding principles, hosting, compliance and sizing

**27 items: 0 Yes, 13 Partly, 14 No.** The verifier downgraded DPDPA and Availability from Partly to No.

| Id | Requirement | Rating | What exists / main gap |
|---|---|---|---|
| GP-i | Transformation, not translation | Partly (weak) | Profile prefill and wallet reuse. No proactive or "No Application" delivery. The life-event engine only runs in MSW mock mode. |
| GP-ii | Integrated, not individual | Partly | Shared application, wallet, notification and audit modules. `Service.department` is free text. `workflowId`, `formId` and Payment are never read. |
| GP-iii | Infrastructure on demand | Partly | A stateless JWT API. No K8s or autoscaling. Redis and BullMQ are never imported. The throttler state is held in memory. Every replica runs `db push` and the seed at boot. |
| GP-iv | Cloud by default | Partly | Containerised backend. No IaC, TLS, secrets manager or object storage. The Node 20 base is EOL. |
| GP-v | Mobile first | Partly | Mobile citizen shell. No PWA or service worker. The user must pick a shell by hand. |
| GP-vi | GoI / State standards | Partly | Unicode Tamil, OpenAPI, adapter seams. Gateway mode is hard-coded `'mock'`. No LGD codes. |
| GP-vii | Tamil and English | Partly | About 143 translation keys used in 14 of 73 UI files. Forms, notifications and live AI replies are English-only. `<html lang="en">` is fixed. |
| GP-viii | GIS (national/State platforms) | **No** | A decorative SVG map only. No TNGIS or Bhuvan, no geocoding, no PostGIS. |
| GP-ix | Security and data preservation | Partly (weak) | helmet, whitelist, throttler, CORS allow-list, JWT rotation and log redaction are real. Against that: the §2 defects, no TLS anywhere (`main.ts:37`, no `sslmode`), no encryption at rest, `secureStorage.ts` is dead code, the audit log records successes only, and the seed wipes AuditLog. |
| HOST-a | Containers, vendor-neutral | Partly | Backend containerised. Root user, EOL Node, no frontend image, pgAdmin `admin/admin`. |
| HOST-b | AI stack in-house; citizen data never leaves | **No** | No models at all. Voice and Google Fonts send data out (§2 #10). |
| CMP-DiTN | DiTN 2023 | **No** | Nothing. |
| CMP-STQC | STQC readiness | **No** | **Zero tests** and no CI. `test:e2e` points at a missing config file. |
| CMP-VAPT | CERT-In VAPT | **No** | Would fail on §2 #1–#9. Also missing the CERT-In 2022 Directions (180-day log retention in India, NTP, 6-hour incident reporting). |
| CMP-DPDPA | DPDPA 2023 + Rules 2025 | **No** | No consent notice or ledger. The "Data Sharing Consent" toggle is **pre-ticked ON** and does nothing (`SecurityScreen.jsx:6`). Plaintext Aadhaar is stored. "Access/correction" goes to whoever logs in. |
| CMP-GIGW | GIGW 3.0 | **No** | No privacy, terms, hyperlink or accessibility-statement pages and no sitemap. `lang` is fixed to `en`. |
| CMP-UX4G | UX4G design system | **No** | Not adopted. Styling is inline across 73 files. |
| CMP-WCAG | WCAG 2.1 AA | Partly | Groundwork is real: 41 aria-labels, focus rings, reduced motion, high-contrast toggle, alt text. Problems: inline `outline:'none'` overrides focus rings (`FileGrievancePanel.tsx:86`), no skip link, no `lang` on Tamil text, no audit. |
| SZ-services | Up to 1,000 services | Partly | A DB catalogue, but each service needs hand-written frontend code and a redeploy. The server accepts any `fields` object without validation. |
| SZ-load | 1.2–1.5 lakh requests/day at peak | Partly (unproven) | No load tests. **Without `trust proxy`, every client behind a load balancer shares one 120 requests/min bucket, about 2 req/s for the whole platform.** The officer queue and search are unbounded. |
| SZ-concurrency | 50,000 concurrent users | **No** | Single instance, no cache, no DB pooler or replicas. |
| SZ-deptusers | 50k–1 lakh department users | **No** | Department users cannot log in as themselves. No provisioning. |
| SZ-levels | Up to 10 approval levels | **No** | One linear pipeline. `approve` jumps from any stage to completed. |
| SZ-availability | >99%, 24x7 | **No** | `/health` returns 200 even when the DB is down (`health.controller.ts:26-31`). No HA, DR, backups or monitoring. Boot can wipe data. |
| SZ-latency | ≤5 s per action at 2 Mbps | Partly | Routes are code-split. The first visit is about 0.75–1.1 MB compressed (entry JS 146 KB, seal SVG 234 KB, map JSON 106 KB, JPGs about 221 KB, plus fonts), or **about 2 MB, since nothing compresses responses**. That is 3–8 s on 2 Mbps. |
| MIG-1 | ~110 TB legacy migration | **No** | No ETL and no object storage. |
| TEST-1 | Automated tests / CI | **No** | Jest is installed, but there are zero spec files. |

---

## 8. What VETRI genuinely brings (use these, honestly)

- A polished **citizen experience** in two shells (phone and desktop) with a TN-specific look, Tamil scheme data served from the API, and Tamil voice input and output.
- A **generic, schema-driven form renderer and validator** (`src/lib/forms/engine.ts`). One application pipeline, wallet, notification feed and audit trail is shared across 20 services. This is a good proof of "integrated, not individual services".
- Sound backend plumbing: NestJS with an audit interceptor, helmet, validation whitelist, throttling and JWT refresh-token rotation. Everything uses permissive OSS licences, so there is no recurring fee.
- A **DPI adapter seam** shaped for real connectors, and an auto-generated OpenAPI spec.

Pitch it as a **citizen-front-end and integration accelerator** that sits on top of a standards-based engine, not as the engine itself.

---

## 9. Recommended Solution Route and stack (Format 5 Q1 and Q2, Format 7)

**Route A: open-source engine plus a custom build, with VETRI as the accelerator.** If you present VETRI as an existing product, call it Route C.

| Format 7 row | Proposed component | Licence | Notes |
|---|---|---|---|
| 1. BPMN/DMN engine and modeller | **Operaton 2.2** (community fork of Camunda 7) + **bpmn-js / dmn-js** | Apache-2.0; bpmn.io licence (free, but the watermark must stay visible, so declare it) | Only fully free, actively released engine with BPMN 2.0 + DMN + FEEL and a stated 6-month support cadence. Fallbacks: Flowable 8 (weaker DMN), Fluxnova. **Reject Camunda 8** (needs a paid production licence) and **Camunda 7 CE** (EOL Oct 2025). |
| 2. Product (Route B) | n/a | — | — |
| 3. DB / search / vector | PostgreSQL 18, OpenSearch 3.x, pgvector | PostgreSQL licence, Apache-2.0 | Upgrade from PG 16. |
| 4. Gateway / broker / cache | **Apache APISIX**, **Valkey** (replacing Redis), BullMQ | Apache-2.0, BSD-3 | Avoid Kong OSS: the open-source line appears frozen. |
| 5. Identity provider | **Keycloak 26** | Apache-2.0 | OIDC + OAuth 2.0 + SAML 2.0, realms for tenants. |
| 6. AI models (on-prem) | vLLM serving an Apache-2.0 Indic LLM (e.g. Sarvam-30B); IndicTrans2 (MIT); IndicConformer ASR (MIT); IndicF5 / Indic Parler-TTS; Tesseract Tamil OCR; bge-m3 embeddings | MIT / Apache-2.0 | Replaces the browser speech API. Avoid Sarvam-Translate (GPL-3.0) and Llama/Gemma (custom licences). Hosted Bhashini conflicts with 5.2(g) if read strictly. |
| 7. Security / DevSecOps | *to be researched* | — | Not covered by this research run. |
| 8. Monitoring | Prometheus, OpenTelemetry, Jaeger; Grafana/Loki/Tempo | Apache-2.0; **AGPL-3.0** (declare it) | — |
| 9. Others | SeaweedFS object storage; rjsf or JSON Forms (JSON Schema forms) | Apache-2.0 / MIT | MinIO's repo was archived in Apr 2026. |

> The versions and licence facts come from a web research pass on 27 Oct 2026, with sources in the run log. **Re-check every version on submission day**, because "n-2" is judged against the latest release at that point.

**Q4 (portability) answer, in short:** processes and decisions are stored as BPMN 2.0 / DMN XML and forms as JSON Schema. Any BPMN-compliant engine (Flowable, Fluxnova, Camunda) can import them, so TNeGA can change engine or agency without rebuilding services.

---

## 10. Non-code blockers (no code can fix these)

| Requirement | Clause | Status to confirm |
|---|---|---|
| Legal entity registered in India, with incorporation certificate | 6(b) | ? |
| **At least 2 live deployments** of the proposed solution, each with a client referral (Format 3B) | 5.3, 8.1 | Probably the deciding gap |
| Government projects of the last 7 years, with work-order numbers (Format 3A) | 8.1 | ? |
| PAN, GSTIN, turnover, certifications, 24x7 support model, TN presence, headcount (Formats 2 and 4) | 8.1 | Information only; no minimums |
| OEM authorisation letter if proposing someone else's product | 6(c) | Operaton is community-governed with no OEM, so say so explicitly |
| tntenders.gov.in registration + Class-3 **DSC**; scanned EOI signed on every page | 8.4 | Register now, because DSC issuance can take days |
| Not engaged by TNeGA in preparing this EOI | 9.4(c) | — |
| Naming: make clear **"VETRI" is your product**, not TNeGA's "Vetri Tamil Nadu" programme. Clear or remove the **State emblem / CM portrait** from anything you submit or demo | 9.5, 5.2(e) | — |

---

## 11. Seven-day plan (27 Oct to 3 Nov, 16:00)

1. **Today, go or no-go.** Do you have an entity, live deployments and a DSC? If you lack the entity or any live deployment, contact an SI or OEM who is responding and offer VETRI as their citizen-UX layer (option A).
2. **Today:** start the tntenders.gov.in registration and DSC if you don't already have them, and watch the site for corrigenda (Cl. 8.2).
3. **Days 1–2, code hygiene before any demo** (TNeGA may call a technical presentation, Cl. 7):
   - Fix §2 #1–#8: auth bypass, role drift, self-approval, plaintext Aadhaar, IDORs and the boot-time data wipe.
   - Remove the fabricated dashboard numbers and the overclaiming copy.
   - Drop `--accept-data-loss` and the default secrets.
4. **Days 2–4, documents:**
   - Format 6: paste §3.
   - Format 5 Part B: paste §4.
   - Format 5 Part A: Q1 = Route A per §9; Q3 = honestly "nothing is configurable today, the proposal makes all 7 configurable"; Q5 = state your real largest deployment; Q6 = suggestions where VETRI's citizen-first thinking adds value (consent design for SFDB pre-fill, Tamil-first UX, assisted-channel parity).
   - Format 7: §9, re-verified.
5. **Days 3–5, optional proof of concept for the presentation:** run Operaton beside NestJS with one service modelled in bpmn-js. Give it a 3-level approval chain, a DMN fee table and a timer-based SLA escalation, all driven from the existing VETRI UI. This turns several "No" answers into "demonstrated in a PoC", but **still not "Yes"**.
6. **Day 6 (2 Nov):** assemble, sign and upload a day early, in case the portal has problems.

## 12. Roadmap to RFP readiness (in order)

1. **Identity and security:** real SMS OTP, server-assigned roles, officer and department user provisioning, Keycloak (OIDC/SAML); fix the IDOR and self-approval holes; secrets management; safe migrations.
2. **Engine:** adopt Operaton; model today's 15-stage flow in BPMN; NestJS external-task workers; routing by post and jurisdiction on LGD codes; SLA timers and escalation; versioning and in-flight migration.
3. **Configuration studio:** bpmn-js, dmn-js and a JSON-Schema form builder with Tamil and English labels; service definitions stored in the DB as one source of truth, replacing `forms.ts`/`meta.ts` and the seed.
4. **Officer workbench:** scoped worklists, forward, return and seek-report actions; delegation, leave and FAC; e-Sign through an ESP, including bulk signing.
5. **Integrations:** connector framework (REST/SOAP, retry, DLQ on BullMQ/Valkey). Order: Tier C (LGD, TNGIS, OGD, e-Taal), then Tier B sandboxes, then Tier A certifications (these need the entity and partners).
6. **Sovereign AI:** on-prem ASR, TTS, translation and LLM stack; grievance classification and duplicate detection; remove the browser speech API.
7. **Compliance and operations:** full i18n, WCAG 2.1 AA audit, GIGW pages, DPDPA consent manager, tests and CI, K8s/IaC, HA and DR, load tests at 50k concurrent users, observability.
8. **e-Sevai operations:** operator console, no-code report builder and migration tooling (~110 TB).

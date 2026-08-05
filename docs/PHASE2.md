# Vetri TN — Phase 2 Deliverables

**From platform to real government services.** Phase 2 adds believable, end-to-end
citizen journeys on top of the Phase 1 engines — **no new architecture**. Every
service flows through the same reusable Form Engine → Application Engine →
Workflow Engine → Document Engine → Notification Engine.

> **Verification note (updated in Phase 2.5):** service metadata was initially
> knowledge-based, then **replaced with verified official values** from the TN
> Govt master research report (see the Phase 2.5 addendum at the end). Each
> `ServiceMeta.sourceNote` now cites its verified basis. No official integration
> is faked — external-only services (Parivahan, TNPDS, TamilNilam) remain
> **Assisted** workflows via the Integration Gateway.

---

## 1. Service Implementation Matrix

All services use one generic `ServiceFlow` (Overview → Eligibility → Documents →
Form → Review → Submit → Tracking → Notifications → Wallet). "Complete" = citizen
can start, fill via the Form Engine, submit, get an Application ID, track, and
(digital) receive the certificate in the Wallet.

| Service | Mode | Dept | Form | Certificate → Wallet | Status |
|---------|------|------|------|----------------------|--------|
| Income Certificate | Digital | Revenue | `form_income` | ✅ | **Verified end-to-end** |
| Community Certificate | Digital | Revenue | `form_community` | ✅ | Complete |
| Birth Certificate | Digital | RBD / Local Body | `form_birth` (conditional hospital field) | ✅ | Complete |
| Death Certificate | Digital | RBD / Local Body | `form_death` | ✅ | Complete |
| Marriage Certificate | Digital | Registration | `form_marriage` (age validation) | ✅ | Complete |
| Driving Licence | Assisted | Transport (Parivahan) | `form_dl` (LL/DL/Renewal/Duplicate/Address) | Handoff | Complete (assisted) |
| Ration Card | Assisted | Civil Supplies (TNPDS) | `form_ration` (New/Modify/Duplicate/Add/Remove) | Handoff | Complete (assisted) |
| Patta Transfer | Assisted | Revenue (TamilNilam) | `form_patta` (Transfer/Subdivision/Correction/Mutation) | Handoff | Complete (assisted) |
| Complaints | Digital | GCC / dept-routed | (wizard, CP5) | n/a | Real IDs + workflow (CP5) |
| Scheme Finder | Digital | — | eligibility Q&A | n/a | Live (CP3/CP5) |

**Wallet** auto-receives every digital certificate on approval (Document Engine);
**Notifications** are generated on submit + certificate-ready.

## 2. Verified Official Sources (per service)

Each `ServiceMeta.sourceUrl` records the authority; all flagged for live re-check.

| Service | Authority / Portal | Basis |
|---------|-------------------|-------|
| Income / Community | TN e-Sevai · tnesevai.tn.gov.in | Revenue Dept CAN-linked certificate norms |
| Birth / Death | RBD Act 1969 · tnreginet.gov.in | 21-day free registration; delayed needs order |
| Marriage | TN Registration Dept · tnreginet.gov.in | HMA / TN Registration of Marriages Act |
| Driving Licence | MoRTH Parivahan Sarathi · parivahan.gov.in | LL/DL age + fee structure |
| Ration Card | TNPDS · tnpds.gov.in | Family-card request types |
| Patta Transfer | TamilNilam · eservices.tn.gov.in | Mutation / transfer-of-registry |

## 3. Workflow diagrams

**Digital services** (`gov.standard.v1`, Workflow Engine):
```
Submitted → Document Verification → Officer Assigned → Department Queue →
Inspection → Remarks → (Escalation) → Approval → Digital Signature →
Certificate Generation → Wallet Delivery → Citizen Notified → Completed
                                     ↘ Correction Requested ↘ Rejected
```
**Assisted services**: identical intake + tracking inside Vetri, with a
"Continue on <portal>" handoff (Integration Gateway) at submission; progress is
preserved (drafts) so the citizen returns to a tracked application.

## 4. Required document matrix (selected)

| Service | Key documents |
|---------|---------------|
| Income | Aadhaar, Ration card, Address proof, Income/salary proof |
| Community | Aadhaar, Ration card, Birth cert, Parent's community cert, School TC |
| Birth | Hospital birth report, Parents' Aadhaar, Marriage cert |
| Death | Medical cause-of-death cert, Deceased Aadhaar, Relationship proof |
| Marriage | Both Aadhaar, Age proof, Wedding proof, 2 witnesses, Joint photo |
| Driving Licence | Age proof, Address proof, Photo, Form 1 self-declaration |
| Ration | Members' Aadhaar, Address proof, Head-of-family photo |
| Patta | Registered deed, EC, Existing patta/chitta |

Each document declares a `source` (`digilocker` for auto-fetch vs `upload`).

## 5. Integration readiness report

The Integration Gateway (`lib/integrations`) exposes typed adapter interfaces;
all are **mock adapters** now, swappable to live with `gateway.register(cap, live)`:

| Capability | Used by | Live-swap |
|-----------|---------|-----------|
| DigiLocker | document auto-fetch, wallet | register real Requester API adapter |
| Parivahan | Driving Licence handoff | register Sarathi adapter |
| TNPDS | Ration Card handoff | register TNPDS adapter |
| TamilNilam | Patta handoff | register land-records adapter |
| Aadhaar / PAN | eKYC / verification | register AUA-KUA adapter |
| SMS / Email / Push | notifications | register DLT SMS / FCM adapters |
| Payment | service fees | register PG adapter |

## 6. AI capability report

The AI Assistant (`features/ai`, intent-matched via MSW) now understands and
**navigates** services: it explains Income / Community / Birth / Driving Licence /
Ration, routes to `service/<id>` to start an application, opens the Tracker, and
opens the Wallet — deep-linking through the same router the UI uses. Deeper
agentic control (auto-fill from chat, summarize/explain rejections) is a Phase 3
LLM swap — the tool-call/navigation contract is already in place.

## 7. Remaining work for Phase 3

- Real LLM behind the AI Engine (auto-fill forms, summarize applications, explain rejections) + Tamil ASR/TTS.
- Live integration adapters (DigiLocker, Parivahan, TNPDS, TamilNilam, Aadhaar, DLT SMS/FCM).
- Document upload **backend storage** (client-side upload UI with validation/preview/wallet-select shipped in Phase 2.5; files need object storage + camera/gallery capture on native).
- Officer / Department / MLA / Admin portals (RBAC + RoleRoute already scaffolded).
- Live re-verification of every `sourceNote`; server-side PDF certificate generation.
- Real backend (NestJS) replacing MSW — base-URL + `enableMocks=false`.

## 8. Demo checklist

1. Log in (biometric — one tap).
2. **Services** → Income Certificate → note official department/fee/time on Overview.
3. Check Eligibility → Documents → Start Application → form is **prefilled** from profile.
4. Complete required fields → Review → **Submit** → real **Application ID**.
5. **Track** → real workflow timeline + assigned officer + RTS deadline.
6. Tap **Check for updates** a few times → status advances.
7. **Documents** (bottom nav) → the issued certificate has appeared in the Wallet.
8. **Notifications** → "Application Submitted" + "Certificate Ready".
9. **AI** → ask "income certificate" / "track my application" → it explains + navigates.
10. Toggle **Tamil** / **Dark Mode** → persists across reload.

## 9. MLA presentation checklist

- Open on **Services** — show real TN services (Income, Community, Birth, Driving Licence…) with official fees & departments.
- Do **one full journey live** (Income Certificate) end-to-end to the Wallet — the "I could actually use this" moment.
- Show the **Tracker** RTS deadline + officer — accountability story.
- Show **Assisted** flow (Driving Licence) — "we keep the citizen inside Vetri and hand off to Parivahan" — honest about integrations.
- Show **Tamil** UI + **AI** in Tamil — inclusion story.
- Close on the architecture slide: one platform, all departments, portals & integrations ready without a rewrite.

## 10. Confirmation

Vetri now behaves like a **real citizen services platform**, not a prototype: a
first-time user can apply for a government service, fill a real validated form,
submit and receive a genuine Application ID, track it through an officer-assigned
government workflow with a Right-to-Service deadline, and receive the issued
certificate in their Wallet — with notifications at each step and an AI that
understands and drives the services. All eight flagship services run through the
**same reusable engines**; adding the next service is configuration, not code.

**Quality gate:** `tsc` clean · `vite build` green (50 code-split chunks) ·
`eslint` 0 errors · no runtime console errors · existing screens pixel-unchanged
(new flows reuse the existing design language).

---

## Phase 2.5 — Verified official metadata + document upload (addendum)

**Metadata replaced with verified official values** (source: TN Govt master research report, imported at `docs`-level and encoded in `features/services/catalog/`):
- `ServiceMeta` expanded: service codes (REV-103/101, IGR-301, REV-501/502/503…), legal basis + Acts, officer hierarchy (VAO → RI → Tahsildar; RDO for SC/ST), issuing/escalation/appeal authorities, Govt-fee vs e-Sevai-charge breakdown (₹60 standard, ₹25 extracts), sub-services (late-registration penalty ladder ₹100/₹200/₹500, LLR/DL/renewal fee matrix, patta REV-50x), certificate validity, digital features, QR/DigiLocker/eKYC/eSign flags, appointment requirement, correction/rejection/appeal workflows, portal + source URLs.
- Forms updated to official field sets: RCH/PICME ID (birth), registration-type ladders, marriage Act selector (3rd witness conditional for SMA), Form 1A/9/LLD conditionals (DL), community proof-source selector, inheritance conditional (patta legal-heir).
- Official upload constraints enforced per document: photo JPEG/PNG ≤50KB, documents PDF/JPEG ≤200KB, generated PDFs ≤500KB.

**Document upload system** (`components/forms/DocumentUpload.tsx`, used by the ServiceFlow Documents step):
device upload, drag & drop, simulated progress, image preview, PDF badge, remove/replace, mime + max-size validation, **select-from-Wallet** (with document number provenance), and a **disabled "Import from DigiLocker"** button labelled "coming when official integration becomes available" (no faked integration; Integration Gateway abstraction untouched). Required-document gating blocks "Start Application" until every required doc is attached; Review shows an Attached Documents summary; submissions persist `documents[]` (requirementId, name, source, walletDocId) via the applications handler.

**Verified live:** size rejection ("Max 50 KB — this file is 60 KB"), mime rejection ("Only JPEG, PNG allowed"), successful upload w/ preview, 4 wallet picks, remove → 4/5 re-add → 5/5 gate reactivity, review summary, submit → `APP-2026-IC-44822` with `documents.length === 5` in the backend. tsc 0 · eslint 0 errors · build green (53 chunks) · no console errors.

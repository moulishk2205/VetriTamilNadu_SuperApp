# Vetri TN — Phase 3.5: 20-Service Catalog Extension

Incremental production extension. **No architecture changed, no engine rebuilt,
no existing service, portal, route, component or API modified.** The platform is
already metadata-driven — the generic `ServiceFlow` (`/service/:id`) + Form
Engine + Application/Workflow/Document/Notification/Wallet engines drive any
catalog entry — so the 20 researched services were added as **configuration**.

## 1. Services Added (13 net-new)

All render through the existing flow (Overview → Eligibility → Documents → Form →
Review → Submit → Tracker → Notifications → Wallet), indistinguishable from the
Phase-2 flagship services.

| Service | Code | Category | Dept | Mode | Cert → Wallet |
|---|---|---|---|---|---|
| Residence Certificate | REV-116 | Certificates | Revenue | Digital | ✅ |
| Nativity Certificate | REV-102 | Certificates | Revenue | Digital | ✅ |
| Legal Heir Certificate | REV-114 | Certificates | Revenue | Digital | ✅ |
| Encumbrance Certificate | TNREG-EC | Revenue | Registration | Digital | ✅ |
| Chitta / Patta Extract | REV-CHITTA | Revenue | Revenue | Digital | ✅ |
| Adangal Extract | REV-ADANGAL | Revenue | Revenue | Digital | ✅ |
| FMB Sketch | REV-FMB | Revenue | Survey & Settlement | Digital | ✅ |
| RC Transfer | TRN-RC-TRANS | Transport | Transport | Assisted | Handoff |
| Duplicate RC | TRN-DUP-RC | Transport | Transport | Assisted | Handoff |
| Vehicle Tax Payment | TRN-MV-TAX | Transport | Transport | Assisted | Receipt |
| e-Challan Payment | TRN-ECHALLAN | Transport | Traffic Police | Assisted | Receipt |
| Property Tax Payment | ULB-PT | **Municipal** | Urban Local Bodies | Assisted | Receipt |
| Water Charges | ULB-WT | **Municipal** | CMWSSB | Assisted | Receipt |

## 2. Services Skipped (7 — already covered; not duplicated)

Per the "never duplicate" rule, these are **already reachable as sub-services**
of existing flagship flows; they were enriched with AI knowledge instead of
being re-created as duplicate flows/routes:

| Requested service | Already covered by |
|---|---|
| Patta Subdivision (REV-503) | `svc_patta` — `transferType` = "Subdivision" (+ `subServices` REV-503) |
| Learner Licence (TRN-LL) | `svc_dl` — `licenceType` = "Learner Licence (LLR)" |
| Driving Licence Renewal (TRN-DL-REN) | `svc_dl` — `licenceType` = "Renewal" |
| Add Family Member (PDS-ADD) | `svc_ration` — `requestType` = "Member Addition" |
| Remove Family Member (PDS-REMOVE) | `svc_ration` — `requestType` = "Member Removal" |
| Address Change / Ration (PDS-ADDRESS) | `svc_ration` — `requestType` = "Address Change" |
| Building / Civic Complaint (ULB-COMPLAINT) | Existing **Complaint Module** (`/complaint`) |

## 3. Files Created / Modified

**Created:** `docs/PHASE3.5-SERVICES.md` (this report).
**Modified (config only — no logic changed):**
- `features/services/catalog/meta.ts` — +13 `ServiceMeta` entries (verified fields: codes, legal basis/Acts incl. G.O. 478/110, officer hierarchy, fees, SLA, validity, digital features, DigiLocker/eKYC flags, portal + source URLs).
- `features/services/catalog/forms.ts` — +13 `FormDefinition`s (official form fields + conditional fields: nativity parent-proof, legal-heir Class-II proof, RC hypothecation NOC, duplicate-RC FIR, etc.).
- `mocks/db.ts` — +1 category `civic` ("Municipal").
- `mocks/handlers/applications.ts` — +13 reference-code prefixes in `SVC_CODE` (RES/NAT/LH/EC/CHT/ADG/FMB/RCT/DRC/MVT/ECH/PTX/WTR).
- `mocks/handlers/ai.ts` — +13 service explainers; enriched "land purchase" (→ EC/Chitta/Patta/Property Tax) and "bereavement" (→ Legal Heir) life-events.
- `components/ui/iconRegistry.tsx` — +7 icons (Home, MapPin, ScrollText, Map, Receipt, Building2, Droplet).

**Routes added:** 0 — all 13 use the existing `/service/:id` route.
**APIs added:** 0 — all use the existing `/api/services`, `/api/applications`, `/api/ai/*`.
**Components added:** 0.

## 4. Metadata / Timeline / AI / Wallet / Notifications / Officer / Admin

- **Metadata:** each service exposes department, sub-department, officer hierarchy, issuing/escalation/appeal authorities, Govt-vs-service fee, SLA, validity, correction/rejection/appeal workflow, digital features — shown on the Overview.
- **Timeline:** issued certificates auto-append to the Digital Citizen Timeline (composed live from wallet + applications).
- **AI:** all 20 services registered in Ask Vetri with eligibility reasoning, common-mistake warnings (e.g. Legal Heir omission = offence; EC search back to 1987; e-Challan clearance before RC transfer), document suggestions and tool-call buttons.
- **Wallet:** digital services (`producesDocumentType`) deliver the certificate to the Wallet on approval via the existing Document Engine.
- **Notifications:** submit + certificate-ready events fire through the existing Notification Engine.
- **Officer Portal:** every new application enters the same work queue and the same Approve/Reject/Correction/Escalate/Transfer/Digital-Issue graph — no new officer code.
- **Admin:** the catalog + gateway health automatically reflect the new services (Admin Overview reads `SERVICE_META`).

## 5. Verification (live)

- `GET /api/services` → **21 services**, all 13 new IDs present; `civic` category present.
- New service Overview (Legal Heir) renders with G.O. 110/2024 basis, ₹60, 15–30 days — identical design language.
- Submissions generate correct reference codes: **APP-2026-CHT-44822** (Chitta), **APP-2026-RES-44823** (Residence).
- Residence Certificate advanced through the workflow → **delivered to the Wallet**.
- AI: "state quota admission" → Nativity; "I bought land" → EC/Chitta/Patta/Property Tax.
- ServicesHub → Municipal filter shows Property Tax + Water Charges in the identical card design.

## 6. Quality gates

`tsc` **0 errors** · `eslint` **0 errors** (1 pre-existing SplashScreen warning) ·
`vite build` green (**77 chunks**) · **no console errors** · existing services,
portals, routes and design language untouched · dark mode / Tamil / accessibility
unaffected · lazy loading and code-splitting preserved.

**Architecture compliance:** ✅ no redesign · ✅ no renames · ✅ no moved/deleted
files · ✅ no duplicate services/routes/APIs/components · ✅ everything reuses the
existing engines. **Regression check:** existing 8 flagship services + 5 portals +
Demo Mode all verified functional.

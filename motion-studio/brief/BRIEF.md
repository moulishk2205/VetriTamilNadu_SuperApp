# VETRI TAMIL NADU — 20-second opening film · Creative brief (ground truth)

## Audience & job
Plays on a large screen in a presentation hall immediately before the project is presented to a
Tamil Nadu Government Minister. In ~20 s the Minister must understand: WHY this exists → WHAT problem
it solves → HOW it works → WHAT it can do → WHY it matters to Tamil Nadu. Desired reaction when it
goes dark: "Now show me how it works." No voiceover. Cinematic synthesized soundscape (no music track).
Not an ad, not a reel, no CTA, no feature-list slideshow, no exaggerated claims, no political
campaign messaging. Story spine requested: COMPLEXITY → INTELLIGENCE → ACTION → IMPACT, felt as ONE
continuous camera movement (no slide feel). 2–6 words per text beat. Every 2–4 s something new.
First 2–3 s must command the room — NOT a logo fade, phone mockup, dashboard screenshot, generic text.
Banned: centered title on gradient, everything fading in, corner labels/frame borders, glow on UI
chrome, generic particle bursts, random HUD, generic "AI" imagery, device mockups.

## The product (verified by reading the code and driving the running app)
Vetri Tamil Nadu is a working prototype of a unified Tamil Nadu government services platform:
one citizen identity → 21 state services (12 fully digital, 9 "assisted" hand-offs) → every application
runs through ONE config-driven 15-stage government workflow (gov.standard.v1) from citizen → system →
officer → signatory, ending with a certificate in the citizen's Digital Locker; officers, departments,
MLAs and administrators each get a role-based portal on the same data. Bilingual Tamil/English.
Two presentations of one codebase: "Mobile Super App" and "Government Web Portal".

App's own words (quotable): "One citizen identity for every government service." · "apply, track and
receive government services without visiting an office" · "A unified digital gateway to Government of
Tamil Nadu citizen services, certificates, welfare schemes and grievance redressal." · onboarding:
"One Citizen Identity / ஒரே குடிமகன் அடையாளம்", "Every Service, One Tap", "Track Everything",
"No Middlemen — Direct access. Transparent timelines. Officer accountability." · transparency pages:
"Delivery performance against Right to Service timelines, published for public scrutiny."

### The one REAL end-to-end chain (captured in a single live session — use this as the story spine)
1. Citizen Chandramoulishwarar K (Chennai · Mylapore, Citizen ID TN-2024-XXXX-8842) opens **Ask Vetri**
   and types **"I bought land"**.
2. Ask Vetri replies with Tamil headline **"சொத்து வாங்குதல் — தேவையான சேவைகளை வரிசைப்படுத்தியுள்ளேன்:"**
   ("Property purchase — I have sequenced the services you need:") and a DEPENDENCY-ORDERED plan:
   1 Encumbrance Certificate (₹116 + ₹5/yr, 2–5 working days) — "due diligence first — search back to 1987
   before you register" → 2 Chitta / Patta Extract (Free, Instant) → 3 Patta Transfer (₹60, 15 days) —
   "mutation after the registered sale deed" → 4 Property Tax Payment — "name change follows the patta
   mutation" → 5 Water Charges — "new connection / name transfer after ownership is recorded".
   "I sequenced these by dependency — start from the top. Your Wallet already holds 4 verified documents
   I can reuse across these." + 4 action cards (Encumbrance Certificate → / Chitta / Patta Extract → /
   Patta Transfer → / Property Tax Payment →).  These 5 services span 4+ departments (Registration
   Dept (IGR) / Sub-Registrar; Revenue; local body; water board).
3. Citizen clicks **Encumbrance Certificate →** → 6-step stepper (Overview, Eligibility, Documents,
   Application, Review, Payment, Submit) prefilled from profile (Zone Mylapore, District Chennai, SRO
   Mylapore, Survey 112/4B) → **"Application submitted · Your application has been received by
   Registration Department (IGR)." Reference APP-2026-EC-44822** in crimson monospace + a real QR
   ("Scan to verify this reference").
4. The application moves through the workflow: Submitted → Document Verification → Officer Assigned →
   Department Queue → Inspection → Remarks → Approval → Digital Signature → Certificate Generation →
   Delivered to Wallet → Citizen Notified → Completed (12-stage main path; 15 stages total incl.
   Escalation / Correction Requested / Rejected branches). Stage actors: citizen/system/officer/
   department/signatory. Stage SLAs (Doc verification 1 day, Inspection 3, Approval 2).
5. Officer **Tmt. R. Kalaivani · Revenue Inspector · Mylapore Taluk** opens the case and chooses
   **"Approve & Issue — eSign (placeholder) → generate certificate → deliver to Wallet"** → Confirm →
   "Case closed — certificate issued and delivered to the citizen's Wallet."  Audit row written.
6. Citizen notification: **"Application Approved — Encumbrance Certificate APP-2026-EC-44822 approved by
   Tmt. R. Kalaivani. Certificate issued to your Wallet."** + "Certificate Ready".
7. **Digital Locker** now shows a 5th card: **Encumbrance Certificate · CRT-2026-EC-44822 · REGISTRATION
   DEPARTMENT (IGR) · ✓ Verified** (beside Driving License DL-TN-2024-8842, Birth Certificate
   BC-TN-2002-4421, Income Certificate IC-TN-2024-9912, Ration Card RC-TN-CHN-7788).
8. Governance side on the same data: **Mylapore Constituency** MLA dashboard (Submitted 4,233 ·
   Completed 3,867 · Pending 298 · Avg Resolution 5.2d · Satisfaction 4.3/5 · Scheme uptake 78%;
   Department performance Revenue 94% · Civil Supplies 91% · GCC 87% · Transport 84% · Registration 82%;
   ward heat map W121–W126 × Income/Ration/Patta/Birth; "Ward 126 (Mylapore) leads service uptake this
   quarter"), Department dashboard / District Scorecard (Applications this month 1,180 · Approved 982 ·
   Pending 128 · Overdue 17 · 4.6 average days to decision; district comparison Chennai 1,180,
   Coimbatore 964, Madurai 842, Trichy 733, Salem 651), Super Admin (21 Services · 38 Districts · 5 Roles ·
   15 Workflow Stages · 14 Integrations (mock)).  Five role portals: Citizen · Officer · Department ·
   MLA · Super Admin.

### Honesty rules (hard constraints)
- Ask Vetri is a DETERMINISTIC reasoning engine (intent → citizen context → plan → tools → composer).
  No LLM. Never call it generative AI / "understands anything". "It plans the order" is true.
- All analytics are seeded demo aggregates; show them as UI, never as claims ("3,867 citizens served").
  No problem statistics exist in the repo — do not invent before/after numbers, office counts, days saved.
- Integrations (DigiLocker, Aadhaar, Parivahan, TamilNilam…) are MOCKS. Never claim live connections.
- "38 districts" = the platform is designed for/registers all 38 districts; not "live in 38 districts".
- Only 12 of 21 services complete in-app; EC (used above) is one of them — good. Patta Transfer,
  Property Tax, Water are assisted hand-offs — don't show them completing.
- eSign is a placeholder; "Digital Signature" is a workflow stage. Payment step only records method.
- Not an officially sanctioned portal: do not assert official status/endorsement in film copy.
- Desktop AI page does NOT show the reasoning-trace lines (mobile app does); a trace overlay must be
  presented as the engine's plan, not as desktop UI.

## Brand & visual system (from the app — the film must feel born from it)
Palette: crimson #9B1B30 (pri), priDk #7A1526, maroon #6B1D2A (acc), deepest #4E1220, gold #D4A843
(sec), secDk #B8922E (foil), secLt #E8C66A, UI ground #F7F7FA / white cards, hairline #E5E7EB,
txt #1C1C1E / #6B7280 / #9CA3AF, ok #059669, warn #D97706, info #2563EB. Gold = light, rules, small
type; never big fills. Type: Inter (UI; 800 w/ −0.5…−0.7 tracking for headlines), Noto Sans Tamil for
Tamil, uppercase overline 12px ls 3 ("GOVERNMENT SUPER APP"), tabular figures, monospace IDs.
Signature motifs present in code: (a) the 3px GOLD RULE under the crimson brand bar / 44px centered
under the title on the selector; (b) the ghosted TN emblem watermark (grayscale, 6–10%); (c) emblem
gold glow; (d) gold shimmer line (120×3); (e) crimson 135° hero gradient r20; (f) crimson outline lucide
icons in 5% crimson rounded tiles r12. Masthead = maroon strip 40px / crimson brand bar 74px / gold rule
3px / white nav 47px with 3px crimson active underline. Radii 14/16/20/22; flat surfaces w/ hairlines.
The app's only authored motion: splash (emblem pops scale .7→1 with cubic-bezier(.34,1.56,.64,1),
breathes gold glow, "Vetri Tamil Nadu" rises 16px, "வெற்றி தமிழ்நாடு" fades in gold, gold shimmer bar).
TN emblem asset is only 128px (keep it ≤ ~120px on screen). Lockup: emblem + "Vetri Tamil Nadu" +
"வெற்றி தமிழ்நாடு".
Client request on party identity: no TVK wording/party names/leader imagery; the film must feel
governmental & neutral, BUT the client asked for "a slight TVK party branding here and there": the
party board uses Core Crimson #A60000, Flag Yellow #FFCC00, warm ivory #F7F3E8, foil gold, a red-yellow-red
flag stripe and a radial flower-ray (vaagai) emblem pattern. Allowed only as subtle, deniable visual
nods (e.g. a warm yellow spark, radial "ray" geometry that is functionally data connections) — never
dominant, never next to the TN emblem as a pairing, never stripes as a flag.

## Tamil Nadu assets available (real data, already processed)
assets/geo.json (projected, 1000 units tall, ~736 wide): state outline; all **38 districts** (names +
paths + centroids); all **234 assembly constituencies** (Mylapore = AC 25, centroid (721.3, 97.7) —
Chennai is a tiny region at the top-right/north-east of the state); 216 taluks; **18,165
village/town polygon centroids** from census shapefiles (can be drawn as points of light — do not
caption a village count). Fonts local: Inter, Inter Tight, Noto Sans Tamil, Noto Serif Tamil, Manrope,
IBM Plex Mono, Cormorant Garamond, Instrument Serif.
Real UI captures at 3840×2160 of every screen + the e2e chain: captures/view/{desktop,flows,e2e}/*.png.

## Production engine (what is feasible)
One HTML page; `window.seek(t)` paints frame t as a pure function of time (no CSS transitions, seeded
noise). DOM for UI rebuilt as crisp vector layers (exact app geometry, fonts, colors), canvas-2D for
maps/points/lines (any zoom level, crisp), CSS 2D/3D transforms for a virtual camera, masks/clip-path,
blur, gradients. Rendered frame-by-frame with headless Chromium at 1920×1080 (or 4K), 30 fps with
180° shutter motion blur. No live footage, no 3D models, no stock. Audio synthesized in Python (sub
impacts, pulses, ticks, filtered-noise whooshes, risers, tonal confirmations, final resolve) on a
measured beat grid; −14 LUFS.

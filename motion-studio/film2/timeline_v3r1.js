// Director's Cut timing. Picture (main.js) and sound (tools/cues2.mjs) both read this.
// 96 BPM · beat 0.625 s · bar 2.5 s · 24 bars = 60 s.
export const BPM = 96
export const BEAT = 60 / BPM
export const BAR = BEAT * 4
export const S16 = BEAT / 4
export const S8 = BEAT / 2
export const TRIP = BEAT / 3
export const DUR = 94
const s16 = (t0, n) => Array.from({ length: n }, (_, i) => +(t0 + i * S16).toFixed(4))
const trip = (t0, n) => Array.from({ length: n }, (_, i) => +(t0 + i * TRIP).toFixed(4))

export const T = {
  // ── ACT I · IMPACT (v1 opening, given room) ─────────────────────────────────
  impact: 0.1, igniteEnd: 2.15, pullEnd: 2.35,
  districts: 1.25, districtsEnd: 2.35,
  hold: 2.5, constit: 2.9, holdEnd: 5.0,          // NEW: the lit state breathes
  dive: 5.0, diveEnd: 5.6,
  bubble: 5.45,
  tiles: s16(5.625, 5),                            // EC, Chitta, Patta, Tax, Water
  wrong: 6.4, wrongEnd: 8.6,
  knot: 8.6,
  q1: 6.9, q1Out: 9.35,                            // "Which office first?"
  snap: 10.0, mastEnd: 10.42,
  hero: 10.05,
  rows: s16(11.25, 5),
  q2: 11.95, q2Out: 13.75,                         // "It plans the order." (after the last row seats)
  flip: 14.35, flipEnd: 14.6,                      // the plan rows hold still; the hero line leaves

  // ── ACT II · UNDERSTANDING — every service, one door ──────────────────────
  cat: 14.6, catEnd: 15.05,                        // the four plan chips fly out and become catalogue cards
  cascade: 14.6, cascadeEnd: 15.75,
  counts: 15.6,
  q3: 16.15, q3Out: 17.6,                          // "21 services. One identity."
  glow: [18.125, 18.2031, 18.2813, 18.4375],       // DL, Ration, Birth together; Schemes tab on the next 16th
  expand: 19.375, expandEnd: 19.85,                 // DL card opens into its page (title FLIP)

  // ── ACT III · PROOF — one citizen, four needs ───────────────────────────────
  // A · Driving Licence (assisted → Parivahan Sarathi)
  A: 20.0, qA: 20.05, qAOut: 20.95,                // "A new address." on a still frame
  listA: 21.2, pickA: 21.8,                        // hold "Address Change" to 22.65
  prefillA: 22.8,
  ackA: 23.75, qrA: 23.55,
  handA: 24.3,                                     // hold "Continue on Parivahan Sarathi"
  dockA: 25.15, dockAEnd: 25.5,                    // rail holds still to 25.95

  // B · Ration Card (assisted → TNPDS): a verified Locker document reused is the hero
  B: 26.25, qB: 26.3, qBOut: 27.35,                // "A new ration card." (held ≥1 s)
  walletB: 27.45, pickB: 28.25,                    // picker read on a still frame; hold "From wallet ✓ Attached"
  chipB: 29.45,                                    // APP-2026-RC-44823 pops with "Continue on TNPDS", held still
  dockB: 30.05, dockBEnd: 30.3,                    // no register dock in B: the reference settles in place

  // C · Birth Certificate (digital, end to end) — the longest, slowest chapter
  C: 30.75, qC: 30.85, qCOut: 31.85,               // "A child is born." (held ≥1 s)
  formC: 31.85, chipC: 32.85,
  spine: 33.125, stages: trip(33.125, 6),
  approval: 34.375, officer: 34.375, officerEnd: 34.75,
  q4: 34.9, q4Out: 35.85,                          // "A named officer approves." over the still card
  confirm: 36.25, stages2: s16(36.25, 6),
  flap: 36.875, flapEnd: 37.2,
  cert: 37.125, seat: 37.8125, count: 37.9,
  rest: 38.0, restEnd: 39.05,                      // one still breath on the new certificate
  dockC: 39.1, dockCEnd: 39.4, completeC: 39.55,

  // D · Schemes → a tangible benefit → the tracked prerequisite
  D: 40.0, suggest: 40.05, page: 40.55,            // the app's own suggestion opens the chapter
  bars: 40.8, barsEnd: 41.35,                      // evidence first: the three best matches fill
  qD: 41.5, qDOut: 42.5,                           // "Ranked for this citizen." on the still, filled ranking
  focusD: 42.6, detail: 43.1,
  ringHero: 43.75, heroRing: 44.05, heroGlint: 44.9, heroOut: 46.55,   // THE MOMENT: 1 g gold ring, held
  howto: 46.95,                                    // then step 1: Obtain an Income Certificate
  railD: 47.45, linkD: 47.6,
  track: 48.05, days: 48.45,                       // the application detail, held still to 49.6

  // E · Complaint filing → follow the interaction
  E: 49.6, qE: 49.75, qEOut: 50.8,                 // "A pothole outside home."
  catE: 51.0, routeE: 51.2,                        // Road Damage → routed live: GCC - Highways · High · 5 days
  descE: 51.75, areaE: 52.65, submitE: 53.05,
  filedE: 53.3, refE: 53.5,                        // CMP-TN-2026-000453 · Submitted
  timeE: 54.35,                                    // resolution timeline, held to 55.6

  // ── ACT IV · PURPOSE ─────────────────────────────────────────────────────────
  reg: 55.6, regEnd: 55.95,                        // the register comes to centre: one citizen's record
  gather: 56.15, dots: 56.2, iris: 56.6, irisEnd: 57.2, hit: 56.9,
  plate: 57.25, plateEnd: 57.8,
  rolls: [58.125, 58.4375, 58.75],                 // Submitted +1 ×3 (DL, Ration, Birth)
  rollDone: 59.0625, rollPend: 59.375,             // Completed +1 (Birth) · Pending +2 (DL, Ration)
  q5: 59.95, q5Out: 61.15,                         // "Counted in Mylapore." — the beginning, not the end

  // ── ACT V · SCALE ─────────────────────────────────────────────────────────────
  lineOut: 61.25, fold: 61.35,                     // the gold line escapes the Mylapore dashboard
  viru: 62.55, viruDash: 62.75, viruHold: 64.75,   // VIRUGAMBAKKAM — arrive, hold, the dashboard resolves
  villi: 65.45, villiHold: 66.45,                  // Villivakkam
  tnagar: 67.1, tnagarHold: 67.95,                 // T. Nagar
  pull: 68.0, scaleEnd: 71.4,                      // the camera accelerates out; constituencies activate in waves
  ring: 68.3, ringEnd: 71.3,
  count234: 70.6, count234End: 71.6, scaleHold: 73.2,
  red: 73.3, redEnd: 75.6,                         // the network turns red + gold
  form: 75.4, formClose: 76.3, formEnd: 78.6,      // portrait, stage 1: recognition (close)
  reveal: 78.6, revealEnd: 80.3, portraitHold: 82.4,   // stage 2: the grand reveal
  lineBack: 82.4, clear: 83.2, clearEnd: 84.2,     // the same gold line re-emerges; the frame clears
  maatram: 84.3, maatramEnd: 85.7, maatramHold: 87.2,  // மாற்றம் — written, then left alone
  to: 87.3,
  identity: 88.2, idWord: 88.5, idSuper: 88.75, idTa: 88.95,
  fadeOut: 92.8,
}

export const COPY = {
  q1: 'Which office first?',
  q2: 'It plans the order.',
  q3: ['21 services.', 'One identity.'],
  qA: 'A new address.',
  qB: 'A new ration card.',
  qC: 'A child is born.',
  q4: ['A named officer', 'approves.'],
  qD: ['Ranked for', 'this citizen.'],
  q5: ['Counted in', 'Mylapore.'],
  qE: 'A pothole outside home.',
  answer: ['One door.', 'Every step in view.'],
}

// Director's Cut timing. Picture (main.js) and sound (tools/cues2.mjs) both read this.
// 96 BPM · beat 0.625 s · bar 2.5 s · 24 bars = 60 s.
export const BPM = 96
export const BEAT = 60 / BPM
export const BAR = BEAT * 4
export const S16 = BEAT / 4
export const S8 = BEAT / 2
export const TRIP = BEAT / 3
export const DUR = 60
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
  B: 26.25, qB: 26.3, qBOut: 27.35,                // "A family of its own." (held ≥1 s)
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

  // D · Schemes → the tracked prerequisite
  D: 40.0, suggest: 40.05, page: 40.5,             // the app's own suggestion opens the chapter
  bars: 40.75, barsEnd: 41.3,                      // evidence first: the three best matches fill
  qD: 41.45, qDOut: 42.45,                         // "Ranked for this citizen." on the still, filled ranking
  focusD: 42.55, detail: 43.05,
  benefit: 43.5,                                   // "1 g gold ring for every baby born…" — the link back to the birth
  howto: 43.95,                                    // then step 1: Obtain an Income Certificate
  railD: 44.35, linkD: 44.5,
  track: 44.95, days: 45.35,                       // the application detail, held still to 46.6

  // ── ACT IV · PURPOSE ─────────────────────────────────────────────────────────
  reg: 46.6, regEnd: 46.95,                        // the register comes to centre: one citizen's record
  gather: 47.15, dots: 47.2, iris: 47.6, irisEnd: 48.2, hit: 47.9,
  plate: 48.25, plateEnd: 48.8,
  rolls: [49.0625, 49.375, 49.6875],               // Submitted +1 ×3 (DL, Ration, Birth)
  rollDone: 50.0, rollPend: 50.3125,               // Completed +1 (Birth) · Pending +2 (DL, Ration)
  q5: 50.9, q5Out: 52.1,                           // "Counted in Mylapore." on a settled plate, held 1.2 s
  fold: 52.25, pullOut: 52.3, pullOutEnd: 53.4,
  ring: 52.6, ringEnd: 54.1,                       // the state re-ignites outward from Mylapore
  callback: 54.3, callbackOut: 54.98,              // the opening question returns in the answer's slot; true silence 55.2–56.25
  line: 55.5, lineEnd: 56.6,                       // the gold line leaves Mylapore, rests, travels, becomes the rule
  answer: 56.3, answer2: 56.55,                    // "One door." / "Every step in view."
  sign: 57.6, signWord: 57.75, signTa: 57.85,
  fadeOut: 59.1,
}

export const COPY = {
  q1: 'Which office first?',
  q2: 'It plans the order.',
  q3: ['21 services.', 'One identity.'],
  qA: 'A new address.',
  qB: 'A family of its own.',
  qC: 'A child is born.',
  q4: ['A named officer', 'approves.'],
  qD: ['Ranked for', 'this citizen.'],
  q5: ['Counted in', 'Mylapore.'],
  answer: ['One door.', 'Every step in view.'],
}

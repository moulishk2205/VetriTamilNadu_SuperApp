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
  hero: 10.2,
  rows: s16(11.25, 5),
  q2: 11.95, q2Out: 13.75,                         // "It plans the order." (after the last row seats)
  flip: 14.35, flipEnd: 14.6,                      // the plan rows hold still; the hero line leaves

  // ── ACT II · UNDERSTANDING — every service, one door ──────────────────────
  cat: 14.6, catEnd: 15.05,                        // the four plan chips fly out and become catalogue cards
  cascade: 14.95, cascadeEnd: 16.1,
  counts: 15.7,
  q3: 16.15, q3Out: 17.6,                          // "21 services. One identity."
  glow: [18.125, 18.4375, 18.75, 19.0625],          // DL, Ration, Birth, Schemes tab
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
  B: 26.25, qB: 26.3, qBOut: 26.95,                // "A new household."
  walletB: 27.3, pickB: 27.95,                     // hold "From wallet ✓ Attached" to 29.2
  chipB: 29.3,                                     // APP-2026-RC-44823 pops with "Continue on TNPDS"
  dockB: 29.95, dockBEnd: 30.3,

  // C · Birth Certificate (digital, end to end) — the longest, slowest chapter
  C: 30.75, qC: 30.85, qCOut: 31.6,                // "A child is born."
  formC: 31.65, chipC: 32.8,
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
  qD: 40.85, qDOut: 41.5,                          // "Ranked for this family." on a still frame
  bars: 41.65, barsEnd: 42.3,
  focusD: 42.4, detail: 43.0,
  howto: 43.35,
  railD: 43.9, linkD: 44.05,
  track: 44.4, days: 44.85,                        // the application detail, held still to 45.75

  // ── ACT IV · PURPOSE ─────────────────────────────────────────────────────────
  reg: 45.75, regEnd: 46.3,                        // the register comes to centre: one citizen's record
  gather: 46.45, dots: 46.5, iris: 47.05, irisEnd: 47.8, hit: 47.45,
  plate: 47.85, plateEnd: 48.4,
  rolls: [48.75, 49.0625, 49.375],                 // Submitted +1 ×3 (DL, Ration, Birth)
  rollDone: 49.6875, rollPend: 50.0,
  q5: 50.35, q5Out: 51.2,                          // "Counted in Mylapore."
  fold: 51.4, pullOut: 51.4, pullOutEnd: 52.7,
  ring: 51.5, ringEnd: 53.2,                       // the state re-ignites outward from Mylapore
  callback: 54.5, callbackOut: 56.05,              // the opening question returns; silence from 55.0
  line: 55.8, lineEnd: 56.3,
  answer: 56.25, answer2: 56.5,                    // "One door." / "Every step in view."
  sign: 57.1, signWord: 57.25, signTa: 57.35,
}

export const COPY = {
  q1: 'Which office first?',
  q2: 'It plans the order.',
  q3: ['21 services.', 'One identity.'],
  qA: 'A new address.',
  qB: 'A new household.',
  qC: 'A child is born.',
  q4: ['A named officer', 'approves.'],
  qD: ['Ranked for', 'this family.'],
  q5: ['Counted in', 'Mylapore.'],
  answer: ['One door.', 'Every step in view.'],
}

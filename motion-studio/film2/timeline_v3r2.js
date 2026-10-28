// Director's Cut timing. Picture (main.js) and sound (tools/cues2.mjs) both read this.
// 96 BPM · beat 0.625 s · bar 2.5 s · 24 bars = 60 s.
export const BPM = 96
export const BEAT = 60 / BPM
export const BAR = BEAT * 4
export const S16 = BEAT / 4
export const S8 = BEAT / 2
export const TRIP = BEAT / 3
export const DUR = 96.5
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
  catE: 51.0, routeE: 51.2,                        // Road Damage → routed live, read close: GCC - Highways · High · 5 days
  descE: 52.3, areaE: 53.15, submitE: 53.5,
  filedE: 53.75, refE: 53.95,                      // CMP-TN-2026-000453 · Submitted
  timeE: 54.75,                                    // resolution timeline, read close, held to 56.1

  // ── ACT IV · PURPOSE ─────────────────────────────────────────────────────────
  reg: 56.1, regEnd: 56.45,                        // the register comes to centre: one citizen's record
  gather: 56.65, dots: 56.7, iris: 57.1, irisEnd: 57.7, hit: 57.4,
  plate: 57.75, plateEnd: 58.3,
  rolls: [58.625, 58.9375, 59.25],                 // Submitted +1 ×3 (DL, Ration, Birth)
  rollDone: 59.5625, rollPend: 59.875,             // Completed +1 (Birth) · Pending +2 (DL, Ration)
  q5: 60.45, q5Out: 61.65,                         // "Counted in Mylapore." — the beginning, not the end

  // ── ACT V · SCALE ─────────────────────────────────────────────────────────────
  lineOut: 61.35, fold: 62.0,                      // the gold line leaves the dashboard while the line is still on screen
  viru: 62.75, viruDash: 62.85, viruHold: 65.0,    // VIRUGAMBAKKAM — arrive, hold, the dashboard resolves
  villi: 65.7, villiHold: 66.6,                    // Villivakkam (faster)
  tnagar: 67.25, tnagarHold: 68.35,                // T. Nagar (card flat ≥ 0.8 s)
  pull: 68.4, scaleEnd: 71.4,                      // the camera pulls out (log zoom); constituencies activate in waves
  ring: 68.7, ringEnd: 71.3,
  count234: 69.9, count234End: 71.4, scaleHold: 73.4,
  red: 73.5, redEnd: 75.8,                         // the network turns red + gold
  form: 75.6, formClose: 76.4,                     // portrait, stage 1: recognition (close), read from the reference
  reveal: 77.8, wipe: 78.8, revealEnd: 79.6,       // stage 2: pull back; the reference is revealed behind the gold line
  goldWipe: 81.3, goldWipeEnd: 81.9,               // red held 79.6–81.3; the gold line wipes it to the yellow reference
  portraitHold: 83.4,                              // gold held 81.9–83.4
  lineBack: 83.4, clear: 83.7, clearEnd: 84.4,     // the same gold line re-emerges; the frame clears to dark
  maatram: 84.7, maatramEnd: 86.1, maatramHold: 88.3,  // மாற்றம் — written, then left alone (≥ 2.2 s)
  to: 88.3, toOut: 89.6,                           // TO
  identity: 90.2, idWord: 90.5, idSuper: 90.75, idTa: 90.95,   // after a clean black beat
  fadeOut: 95.0,
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

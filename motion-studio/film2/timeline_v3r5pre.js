// Director's Cut timing. Picture (main.js) and sound (tools/cues2.mjs) both read this.
// 96 BPM · beat 0.625 s · bar 2.5 s · 24 bars = 60 s.
export const BPM = 96
export const BEAT = 60 / BPM
export const BAR = BEAT * 4
export const S16 = BEAT / 4
export const S8 = BEAT / 2
export const TRIP = BEAT / 3
export const DUR = 97.4
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
  D: 40.0, suggest: 40.05, page: 40.85,            // the app's own suggestion opens the chapter (read ≥ 0.4 s)
  bars: 41.05, barsEnd: 41.6,                      // evidence first: the three best matches fill
  qD: 41.65, qDOut: 42.6,                           // "Ranked for this citizen." on the still, filled ranking
  focusD: 42.7, detail: 44.2,                      // the dialog opens behind the hero veil (never flashed)
  ringHero: 43.75, heroRing: 44.05, heroGlint: 44.9, heroOut: 46.55,   // THE MOMENT: 1 g gold ring, held
  howto: 46.95,                                    // then step 1: Obtain an Income Certificate
  railD: 47.45, linkD: 47.6,
  track: 48.05, days: 48.45,                       // the application detail, held still to 49.6

  // E · Complaint filing → follow the interaction
  E: 49.6, qE: 49.75, qEOut: 50.8,                 // "A pothole outside home."
  catE: 51.0, routeE: 51.2,                        // Road Damage → routed live, read close: GCC - Highways · High · 5 days
  descE: 52.3, areaE: 53.15, submitE: 53.5,
  filedE: 53.75, refE: 53.95,                      // CMP-TN-2026-000453 · Submitted
  timeE: 54.75,                                    // resolution timeline, read close, held to 56.5

  // ── ACT IV · PURPOSE ─────────────────────────────────────────────────────────
  reg: 56.5, regEnd: 56.85,                        // the register comes to centre: one citizen's record
  gather: 57.05, dots: 57.1, iris: 57.5, irisEnd: 58.1, hit: 57.8,
  plate: 58.15, plateEnd: 58.7,
  rolls: [59.025, 59.3375, 59.65],                 // Submitted +1 ×3 (DL, Ration, Birth)
  rollDone: 59.9625, rollPend: 60.275,             // Completed +1 (Birth) · Pending +2 (DL, Ration)
  q5: 60.85, q5Out: 61.95,                         // "Counted in Mylapore." — the beginning, not the end

  // ── ACT V · SCALE ─────────────────────────────────────────────────────────────
  lineOut: 61.75, fold: 62.4,                      // the gold line leaves the dashboard while the line is still on screen
  viru: 63.15, viruDash: 63.25, viruHold: 65.4,    // VIRUGAMBAKKAM — arrive, hold, the dashboard resolves
  villi: 66.1, villiHold: 66.9,                    // Villivakkam (faster)
  tnagar: 67.5, tnagarHold: 68.45,                 // T. Nagar (faster still)
  pull: 68.5, scaleEnd: 70.6,                      // the camera accelerates out (log zoom); constituencies activate in waves
  ring: 68.8, ringEnd: 70.5,
  count234: 70.6, count234End: 71.9, scaleHold: 73.5,   // counts once the whole state is framed; lands on the hit
  red: 73.6, redEnd: 75.9,                         // the network turns red + gold
  form: 75.7, formClose: 76.6,                     // portrait, stage 1: the silhouette forms from gold points (close)
  reveal: 78.5, revealEnd: 80.3,                   // stage 2: pull back; the face emerges from the silhouette (a dissolve, no wipe)
  goldWipe: 81.5, goldWipeEnd: 82.7,               // red held to 81.5; then gold spreads out of Chennai: the map turns yellow
  portraitHold: 83.7,                              // the yellow reference held clean 82.7–83.95
  lineBack: 83.5, clear: 83.95, clearEnd: 84.65,   // the same gold line re-emerges from Chennai; the portrait steps aside and dips to dark
  maatram: 84.8, maatramEnd: 86.2, maatramHold: 88.4,  // மாற்றம் — written, then left alone (≥ 2.2 s)
  to: 88.4, toOut: 89.85,                           // TO
  identity: 90.7, idWord: 91.0, idSuper: 91.25, idTa: 91.45,   // after a full black beat carried by the gold line
  fadeOut: 95.9,
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

// Single source of truth for timing. Picture (main.js) and sound (tools/cues.mjs) both read this.
// 96 BPM · beat 0.625 s · bar 2.5 s · 8 bars = 20 s.
export const BPM = 96
export const BEAT = 60 / BPM
export const BAR = BEAT * 4
export const S16 = BEAT / 4
export const S8 = BEAT / 2
export const TRIP = BEAT / 3
export const DUR = 20

export const T = {
  // Bar 1 — the state
  impact: 0.1,
  igniteEnd: 2.15,
  pullEnd: 2.35,
  districts: 1.25,
  districtsEnd: 2.35,

  // Bar 2 — one citizen, the problem
  dive: 2.5,
  diveEnd: 3.05,
  bubble: 2.95,                 // point → crimson bubble
  tiles: [3.125, 3.125 + S16, 3.125 + 2 * S16, 3.125 + 3 * S16, 3.75], // EC, Chitta, Patta, Tax, Water pop order
  wrong: 3.6,                   // thread starts visiting tiles in the wrong order
  wrongEnd: 4.5,
  knot: 4.5,
  q1: 3.7, q1Out: 4.7,         // "Which office first?"

  // Bar 3 — intelligence
  snap: 5.0,
  mastEnd: 5.42,
  hero: 5.2,                    // Tamil hero type
  rows: [5.9375, 5.9375 + S16, 5.9375 + 2 * S16, 5.9375 + 3 * S16, 6.5625], // ascending order
  q2: 6.25, q2Out: 7.42,        // "It plans the order."
  flip: 7.2, flipEnd: 7.55,

  // Bar 4 — apply
  press: 7.5 + S8,              // 7.8125
  pushEnd: 8.25,
  stepIn: 8.25, stepInEnd: 8.75,
  prefill: 8.45,
  steps: [8.75, 8.75 + S16, 8.75 + 2 * S16, 8.75 + 3 * S16, 9.375, 9.375 + S16, 9.375 + 2 * S16],
  submitGrow: 9.72,

  // Bar 5 — receipt + workflow
  ack: 10.0,
  qr: 10.12, qrEnd: 10.62,
  spine: 11.25,
  stages: [11.25, 11.25 + TRIP, 11.25 + 2 * TRIP, 11.25 + 3 * TRIP, 11.25 + 4 * TRIP, 11.25 + 5 * TRIP],
  q3: 11.36, q3Out: 12.28,      // "One workflow. Every application."

  // Bar 6 — approval + delivery
  approval: 12.5,
  officer: 12.5, officerEnd: 12.86,
  q4: 12.72, q4Out: 14.02,       // "A named officer approves."
  confirm: 12.5 + BEAT,         // 13.125
  stages2: [13.125, 13.125 + S16, 13.125 + 2 * S16, 13.125 + 3 * S16, 13.75, 13.75 + S16], // Approval…Completed
  flap: 13.75, flapEnd: 14.12,
  cert: 14.0, certEnd: 14.375,
  seat: 14.6875,
  count: 14.75,

  // Bar 7 — impact
  iris: 15.0, irisEnd: 15.6,
  plate: 15.625, plateEnd: 16.1,
  pills: [15.95, 16.05, 16.15],
  roll1: 16.25, roll2: 16.5625,
  q5: 15.75, q5Out: 17.05,      // "Same data. Every role."

  // Bar 8 — the state, lockup
  fold: 17.1875, pullOut: 17.1875, pullOutEnd: 18.2,
  ring: 17.5, ringEnd: 19.3,
  q6: 17.3, q6Out: 18.18,     // "Designed for all 38 districts."
  line: 18.32, lineEnd: 18.74,
  lockup: 18.75,
  word: 18.86, tamil: 18.96, stmt: 19.06,
}

export const COPY = {
  q1: 'Which office first?',
  q2: 'It plans the order.',
  q3: 'One workflow. Every application.',
  q4: 'A named officer approves.',
  q5: 'Same data. Every role.',
  q6: 'Designed for all 38 districts.',
  q6ta: '38 மாவட்டங்கள்',
  close: 'One citizen identity.',
  closeTa: 'ஒரே குடிமகன் அடையாளம்',
}

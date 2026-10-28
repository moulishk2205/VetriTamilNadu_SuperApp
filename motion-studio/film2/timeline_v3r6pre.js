// Director's Cut timing. Picture (main.js) and sound (tools/cues2.mjs) both read this.
// 96 BPM · beat 0.625 s · bar 2.5 s · 24 bars = 60 s.
export const BPM = 96
export const BEAT = 60 / BPM
export const BAR = BEAT * 4
export const S16 = BEAT / 4
export const S8 = BEAT / 2
export const TRIP = BEAT / 3
export const DUR = 100.2
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
  railD: 47.8, linkD: 47.95,                       // step 1 is read (~1 s) before the register joins
  track: 48.35, days: 48.7,                       // the application detail, held still to 49.6

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
  viru: 63.15, viruDash: 63.25, viruHold: 65.2,    // VIRUGAMBAKKAM — arrive, hold, the dashboard resolves
  villi: 65.9, villiHold: 66.9,                    // Villivakkam (faster)
  tnagar: 67.5, tnagarHold: 68.45,                 // T. Nagar (faster still)
  pull: 68.5, scaleEnd: 70.6,                      // the camera accelerates out (log zoom); constituencies activate in waves
  ring: 68.8, ringEnd: 70.5,
  count234: 70.6, count234End: 71.9, scaleHold: 73.5,   // counts once the whole state is framed; lands on the hit
  red: 73.6, redEnd: 75.9,                         // the network turns red + gold
  form: 75.95, formClose: 76.95,                   // portrait, stage 1: a clean red map, then one slow push in while gold points gather into the silhouette
  reveal: 78.2, revealEnd: 79.9, faceWhole: 80.3,  // stage 2: pull back; the face lifts out of the dark silhouette (a dissolve, no wipe)
  goldWipe: 81.3, goldWipeEnd: 82.5,               // red held; then gold spreads out of Chennai: the map turns yellow
  portraitHold: 83.6,                              // the yellow reference held clean ~1.1 s
  lineBack: 83.6, clear: 84.0, clearEnd: 84.9,     // the same gold line re-emerges from Chennai; the portrait steps aside and dips to dark
  maatram: 85.1, maatramEnd: 86.5,                 // மாற்றம் — the line passes beneath and lights each letter; then read alone
  scram: 88.0,                                     // மாற்றம் begins to evolve: the underline gathers to a point; மா starts to search
  scramEnd: 89.8,                                  // … முன்னேற்றம் resolves (Tamil grapheme clusters only; ற்றம் survives)
  munLine: 90.65,                                  // after a still hold, the gold line grows outward beneath it
  step: 91.45, stepOut: 93.05,                     // A SMALL STEP TOWARDS — the bridge
  identity: 93.55, idWord: 93.85, idSuper: 94.1, idTa: 94.3,   // the answer: the app's identity (the line lands as its rule)
  fadeOut: 98.7,
}

// ── மாற்றம் → முன்னேற்றம்: a controlled typographic evolution (SplitFlapText's logic, Tamil grapheme clusters, no tiles) ──
// Each changed slot steps through intermediate clusters, then lands on its target; unchanged slots (ற் ற ம்) never flip.
// Step times sit on the 30 fps frame grid so every glyph is whole inside a frame; picture and sound read the same schedule.
export const SCR = (() => {
  let a = 20261003 >>> 0
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const F = (x) => Math.round(x * 30) / 30
  // pools are width-matched to each target cluster (measured in the film's own Noto Sans Tamil 700 at 236 px) so no letter ever collides
  const WIDE = [
    ['கி', 'கு', 'சு', 'டு', 'தி', 'து', 'நி', 'பி', 'யி', 'யு', 'ரி', 'ரு', 'வு', 'ழு', 'றி', 'று', 'ங', 'ஞ', 'த', 'ந', 'ய', 'ல', 'வ', 'ழ', 'ள'],   // ≈ மு
    ['கி', 'கு', 'கூ', 'சி', 'சூ', 'டு', 'டூ', 'தி', 'து', 'நி', 'நு', 'பி', 'பூ', 'யி', 'யு', 'ரி', 'ரு', 'லி', 'லு', 'வி', 'வு', 'ழி', 'ழு', 'ளி', 'றி', 'று'],   // ≈ ன்
    ['கா', 'கெ', 'கை', 'கோ', 'செ', 'சை', 'டெ', 'டை', 'தா', 'தெ', 'தை', 'நா', 'நெ', 'பெ', 'பை', 'மா', 'மெ', 'யா', 'யெ', 'ரெ', 'லா', 'லெ', 'வா', 'வெ', 'ழா', 'ழெ', 'ளா', 'றா', 'றெ'],   // ≈ னே
  ]
  const FAM = [
    ['ம', 'மி', 'மீ', 'மூ', 'ம்'],                          // → மு   (the same letter, searching for its vowel)
    ['ன', 'னீ', 'ந்', 'ய்', 'ள்', 'ங்'],                      // → ன்   (converging on the pulli form)
    ['நே', 'லே', 'றே', 'வே', 'யே', 'தே', 'மே', 'ழே'],         // → னே   (converging on the ே form)
  ]
  const src = ['மா', 'ற்', 'ற', 'ம்'], tgt = ['மு', 'ன்', 'னே', 'ற்', 'ற', 'ம்']
  const changed = [
    { slot: 0, from: 'மா', start: T.scram + 0.1, lock: T.scram + 1.25 },
    { slot: 1, from: null, start: T.scram + 0.25, lock: T.scram + 1.4 },
    { slot: 2, from: null, start: T.scram + 0.35, lock: T.scram + 1.55 },
  ]
  const plans = changed.map((c, i) => {
    const start = F(c.start), lock = F(c.lock), steps = []
    let tt = start, prev = c.from
    while (tt < lock - 1e-6) {
      const u = (tt - start) / (lock - start)
      const fr = Math.max(2, Math.round(2 + 3 * Math.pow(1 - Math.sin(Math.PI * u), 1.4)))   // slow → quick → slow: controlled, never a glitch
      const pool = rnd() < Math.min(1, Math.max(0, (u - 0.3) / 0.5)) ? FAM[i] : WIDE[i]   // converging on the target's own letter family
      let g; do { g = pool[Math.floor(rnd() * pool.length)] } while (g === prev || g === tgt[c.slot])
      steps.push({ t: +tt.toFixed(4), g }); prev = g
      tt = F(tt + fr / 30)
    }
    steps.push({ t: +lock.toFixed(4), g: tgt[c.slot], lock: true })
    return { ...c, start, lock, steps }
  })
  return { src, tgt, plans, open: [T.scram + 0.15, T.scram + 0.75] }   // the word widens over `open` as the new slots arrive
})()

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

// Director's Cut timing. Picture (main.js) and sound (tools/cues2.mjs) both read this.
// 96 BPM · beat 0.625 s · bar 2.5 s · 24 bars = 60 s.
export const BPM = 96
export const BEAT = 60 / BPM
export const BAR = BEAT * 4
export const S16 = BEAT / 4
export const S8 = BEAT / 2
export const TRIP = BEAT / 3
export const DUR = 101.2
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
  E: 50.225, qE: 50.375, qEOut: 51.425,                 // "A pothole outside home."
  catE: 51.625, routeE: 51.825,                        // Road Damage → routed live, read close: GCC - Highways · High · 5 days
  descE: 53.375, areaE: 54.025, submitE: 54.225,
  filedE: 54.475, refE: 54.625,                      // CMP-TN-2026-000453 · Submitted
  timeE: 55.375,                                    // resolution timeline, read close, held to 56.5

  // ── ACT IV · PURPOSE ─────────────────────────────────────────────────────────
  reg: 57.125, regEnd: 57.475,                        // the register comes to centre: one citizen's record
  gather: 57.675, dots: 57.725, iris: 58.125, irisEnd: 58.725, hit: 58.425,
  plate: 58.775, plateEnd: 59.325,
  rolls: [59.65, 59.9625, 60.275],                 // Submitted +1 ×3 (DL, Ration, Birth)
  rollDone: 60.5875, rollPend: 60.9,             // Completed +1 (Birth) · Pending +2 (DL, Ration)
  q5: 61.475, q5Out: 62.575,                         // "Counted in Mylapore." — the beginning, not the end

  // ── ACT V · SCALE ─────────────────────────────────────────────────────────────
  lineOut: 62.375, fold: 63.025,                      // the gold line leaves the dashboard while the line is still on screen
  viru: 63.775, viruDash: 63.875, viruHold: 65.825,    // VIRUGAMBAKKAM — arrive, hold, the dashboard resolves
  villi: 66.525, villiHold: 67.525,                    // Villivakkam (faster)
  tnagar: 68.125, tnagarHold: 69.075,                 // T. Nagar (faster still)
  pull: 69.125, scaleEnd: 71.225,                      // the camera accelerates out (log zoom); constituencies activate in waves
  ring: 69.425, ringEnd: 71.125,
  count234: 71.225, count234End: 72.225, scaleHold: 74.125,   // counts once the whole state is framed; lands on the hit
  red: 74.225, redEnd: 76.525,                         // the network turns red + gold
  form: 76.325, formClose: 77.925,                     // portrait, stage 1: a clean red map, then one slow push in while gold points gather into the silhouette
  reveal: 78.825, revealEnd: 80.525, faceWhole: 80.525,  // stage 2: pull back; the face lifts out of the dark silhouette (a dissolve, no wipe)
  goldWipe: 81.925, goldWipeEnd: 83.125,               // red held; then gold spreads out of Chennai: the map turns yellow
  portraitHold: 84.225,                              // the yellow reference held clean ~1.1 s
  lineBack: 84.225, clear: 84.625, clearEnd: 85.525,     // the same gold line re-emerges from Chennai; the portrait steps aside and dips to dark
  maatram: 85.725, maatramEnd: 87.125,                 // the line draws the underline (85.1–85.55); a glint returns and lights மாற்றம் in reading order
  scram: 89.025,                                     // read whole ~2 s; then மாற்றம் begins to evolve (the underline gathers to a spark)
  scramEnd: 90.825,                                  // … முன்னேற்றம் resolves (Tamil grapheme clusters only; ற்றம் survives)
  munLine: 92.025,                                   // after a still hero hold, the gold line grows outward beneath it
  step: 92.825, stepOut: 94.775,                       // A SMALL STEP TOWARDS — the bridge
  identity: 95.075, idWord: 95.225, idSuper: 95.475, idTa: 95.675,   // the answer: the line lands as the lockup's rule; the emblem rises from it
  fadeOut: 99.625,
}

// ── மாற்றம் → முன்னேற்றம்: a controlled typographic evolution (SplitFlapText's logic, Tamil grapheme clusters, no tiles) ──
// Changed slots step through intermediate clusters to their target; unchanged slots (ற் ற ம்) never flip.
// All slots step on ONE shared 0.1 s grid (3 frames): the word changes at most 10× a second — controlled, never a flicker.
// Pools are width-matched (±10 % of each target's advance in Noto Sans Tamil 700); every frame's full string is checked
// against a blacklist of real / loaded words and party abbreviations, then the step is redrawn (deterministic seed).
export const SCR = (() => {
  let a = 20261003 >>> 0
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const R = (x) => +(Math.round(x * 30) / 30).toFixed(4)   // every step sits on a frame boundary
  // pools: width-matched (±10 % of each target's advance, Noto Sans Tamil 700), word-initial-capable clusters for slot 0, nothing colloquial (no டா)
  const OPEN0 = ['கா', 'பா', 'தா', 'வா']                                                            // slot 0's first picks: at least as wide as மா, so the word only grows
  const WIDE = [
    ['கி', 'கு', 'சி', 'தி', 'து', 'நி', 'நு', 'பி', 'வ', 'வு', 'யூ'],                                   // ≈ மு (291)
    ['சூ', 'ரா', 'ரூ', 'லி', 'லு', 'வி', 'வூ', 'ழூ', 'ளி', 'றி', 'று', 'யி'],                           // ≈ ன் (321)
    ['கை', 'சை', 'சோ', 'டை', 'டோ', 'ணி', 'ணு', 'தை', 'நை', 'பை', 'மை', 'யெ', 'யை', 'ரை', 'ரோ', 'லெ', 'வெ', 'ழை', 'ளெ', 'றெ', 'றை'],
  ]
  const FAM = [
    ['மி', 'து', 'நு', 'கு'],                     // → மு   (the ம form and the u-hook converge)
    ['ன', 'னீ', 'ஞ்', 'ஞ'],                       // → ன்
    ['னெ', 'னா', 'னூ', 'ளே', 'ஞே', 'லெ', 'வெ'],   // → னே
  ]
  const BAN = ['நாற்றம்', 'ஞாற்றம்', 'குற்றம்', 'சீற்றம்', 'தடுமாற்றம்', 'ஏமாற்றம்', 'தோற்றம்', 'ஏற்றம்', 'மாற்றம்', 'முன்னேற்றம்', 'சூது', 'சூதை', 'சாவு', 'சாக', 'நோய்', 'கேடு', 'பொய்',
    'தோல்வி', 'கொலை', 'பிணம்', 'பேய்', 'கள்ள', 'திருட', 'வெறி', 'கேவல', 'அழி', 'குடி', 'சாதி', 'ரத்த', 'நாய்', 'பன்றி', 'மலம்', 'ஊழல்', 'லஞ்ச', 'டா', 'நீறை', 'னீறை',
    'திமு', 'அதிமு', 'மதிமு', 'தவெ', 'பாஜ', 'காங்', 'பாம', 'நாத', 'விசி', 'தேமு', 'மநீ', 'அமமு', 'கட்சி', 'ஓட்டு', 'தேர்தல்']
  const src = ['மா', 'ற்', 'ற', 'ம்'], tgt = ['மு', 'ன்', 'னே', 'ற்', 'ற', 'ம்'], tail = 'ற்றம்'
  // ONE shared rhythm: the whole word holds 0.2 s at both ends and steps every 0.1 s in the middle (never more than 10 changes a second)
  const S = T.scram, GRID = [0.1, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.6].map((x) => R(S + x))
  const spec = [{ slot: 0, from: 'மா', start: R(S + 0.1), lock: R(S + 1.2) }, { slot: 1, from: null, start: R(S + 0.3), lock: R(S + 1.4) }, { slot: 2, from: null, start: R(S + 0.5), lock: R(S + 1.6) }]
    .map((c) => ({ ...c, steps: [] }))
  const cur = ['மா', '', '']
  for (const tt of GRID) {
    for (const c of spec) {
      if (tt < c.start - 1e-6 || tt > c.lock + 1e-6 || (c.steps.length && c.steps.at(-1).lock)) continue
      if (Math.abs(tt - c.lock) < 1e-6) { cur[c.slot] = tgt[c.slot]; c.steps.push({ t: tt, g: tgt[c.slot], lock: true }); continue }
      const u = (tt - c.start) / (c.lock - c.start), n0 = c.steps.length
      const pool = c.slot === 0 && n0 < 2 ? OPEN0 : rnd() < Math.min(1, Math.max(0, (u - 0.35) / 0.45)) ? FAM[c.slot] : WIDE[c.slot]
      let g = null
      for (let tries = 0; tries < 80 && !g; tries++) {
        const cand = pool[Math.floor(rnd() * pool.length)]
        if (cand === cur[c.slot] || cand === tgt[c.slot]) continue
        const trial = cur.slice(); trial[c.slot] = cand
        if (BAN.some((w) => (trial.join('') + tail).includes(w))) continue
        g = cand
      }
      if (!g) continue   // no safe candidate: this slot simply holds for a tick
      cur[c.slot] = g; c.steps.push({ t: tt, g })
    }
  }
  const plans = spec
  const frames = []   // every distinct full string shown, for a native reader's sign-off
  { const st = ['மா', '', '']; for (const tt of GRID) { let ch = false; for (const p of plans) for (const x of p.steps) if (Math.abs(x.t - tt) < 1e-6) { st[p.slot] = x.g; ch = true } if (ch) frames.push({ t: tt, s: st.join('') + tail }) } }
  return { src, tgt, plans, frames, open: [R(S + 0.2), R(S + 0.8)], BAN, GRID }
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

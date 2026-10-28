// Director's Cut cue sheet: v1's sonic identity (same instruments, same D-major-pentatonic "order"
// and out-of-key "problem" cluster), expanded into an arc across 60 s.
import fs from 'node:fs'
import { T, BPM, BEAT, BAR, S16, S8, DUR, SCR } from '../film2/timeline.js'
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
{ // guard: a key written twice in T silently overwrites the earlier cue (it once broke the opening) — fail loudly
  const src = fs.readFileSync(new URL('../film2/timeline.js', import.meta.url), 'utf8')
  const t0 = src.indexOf('export const T = {'), body = src.slice(t0, src.indexOf('\n}', t0)).replace(/\/\/[^\n]*/g, '')
  const seen = new Set(), dup = []
  for (const m of body.matchAll(/(?<![\w.])([A-Za-z_]\w*)\s*:/g)) { if (seen.has(m[1])) dup.push(m[1]); seen.add(m[1]) }
  if (dup.length) throw new Error('timeline.js: duplicate keys in T → ' + dup.join(', '))
}

const cues = []
const c = (t, type, o = {}) => cues.push({ t: +t.toFixed(4), type, ...o })
const ORDER = [587.33, 659.25, 739.99, 880.0, 987.77]
const CLUSTER = [622.25, 415.3, 932.33, 523.25, 830.61]
const HI = [1174.66, 1318.51, 1479.98, 1760.0, 1975.53, 2349.32, 2637.02]

// ── bed: the drone carries the film, and drops out before the answer ──
c(0, 'drone', { d: T.red + 0.6, gain: 0.07, rev: 0.2 })

// ── ACT I · deep, restrained, intriguing ─────────────────────────────────────
c(T.impact, 'sub', { d: 2.6, f0: 62, f1: 33, gain: 1.0, click: 0.6, rev: 0.5 })
c(T.impact, 'boom_air', { d: 3.4, gain: 0.55, rev: 0.6 })
c(T.impact, 'pluck', { f: 1760, d: 2.0, gain: 0.12, bright: 0.4, rev: 0.9 })
c(T.impact + 0.05, 'data_stream', { d: 2.0, rate: 46, f: [2600, 6200], gain: 0.07, p_spread: 0.9, seed: 3, accel: -0.6, rev: 0.5 })
for (let k = 0; k < 3; k++) c(T.districts + k * S8, 'pluck', { f: [2349.3, 2637.0, 2959.9][k], d: 1.2, gain: 0.06, bright: 0.3, p: [-0.4, 0.3, 0.6][k], rev: 0.9 })
// the hold: air and a slow, low swell — the state breathes
c(T.hold, 'chord_pad', { freqs: [73.42, 110.0, 146.83], d: 2.8, gain: 0.07, a: 1.4, r: 1.2, cutoff: 700, rev: 0.7 })
c(T.constit, 'data_stream', { d: 1.8, rate: 12, f: [3200, 6000], gain: 0.03, p_spread: 1.0, seed: 61, rev: 0.9 })
c(T.dive - 0.05, 'whoosh', { d: 0.66, f0: 180, f1: 3200, gain: 0.32, p0: 0.5, p1: -0.2, peak: 0.85, rev: 0.4 })
c(T.diveEnd, 'sub', { d: 0.9, f0: 90, f1: 48, gain: 0.45, click: 0.3, rev: 0.4 })
c(T.bubble + 0.03, 'pluck', { f: 587.33, d: 1.0, gain: 0.16, bright: 0.7, rev: 0.6 })
c(T.bubble + 0.03, 'tick', { f: 2600, gain: 0.12 })
T.tiles.forEach((tt, i) => c(tt, 'pluck', { f: CLUSTER[i], d: 1.3, gain: 0.13, bright: 1.1, p: [0.5, -0.6, 0.6, -0.4, 0.2][i], rev: 0.5 }))
c(T.wrong, 'riser', { d: T.snap - T.wrong, f0: 220, f1: 3800, gain: 0.18, tone: 196, rev: 0.3 })
c(T.knot, 'data_stream', { d: T.snap - T.knot, rate: 26, f: [1800, 3600], gain: 0.06, seed: 9, accel: 2.8, rev: 0.2 })

// ── ACT I→II · the snap, the order: clarity ──────────────────────────────────
c(T.snap - 0.02, 'whoosh', { d: 0.22, f0: 4000, f1: 600, gain: 0.3, p0: 0.8, p1: -0.8, peak: 0.25, rev: 0.3 })
c(T.snap, 'sub', { d: 2.2, f0: 70, f1: 36, gain: 0.85, click: 0.8, rev: 0.5 })
c(T.snap, 'chord_pad', { freqs: [73.42, 110.0, 146.83, 220.0], d: 2.6, gain: 0.16, a: 0.04, r: 1.6, cutoff: 1400, rev: 0.6 })
c(T.snap + 0.03, 'tick', { f: 3200, gain: 0.1, p: 0.2 }); c(T.snap + 0.15, 'tick', { f: 2800, gain: 0.07, p: -0.2 })
c(T.hero, 'data_stream', { d: 0.7, rate: 22, f: [3500, 7000], gain: 0.04, seed: 21, rev: 0.7 })
T.rows.forEach((tt, i) => c(tt, 'pluck', { f: ORDER[i], d: 1.6, gain: 0.17, bright: 0.8, p: -0.3 + i * 0.15, rev: 0.6 }))
c(T.rows[4] + 0.02, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 369.99], d: 1.8, gain: 0.08, a: 0.25, r: 1.0, cutoff: 2000, rev: 0.7 })
c(T.flip - 0.02, 'whoosh', { d: 0.45, f0: 400, f1: 2600, gain: 0.14, p0: 0.6, p1: -0.4, peak: 0.6 })

// ── ACT II · every service, one door: rhythm enters ─────────────────────────
c(T.cat, 'whoosh', { d: 0.55, f0: 600, f1: 3400, gain: 0.16, p0: -0.4, p1: 0.4, peak: 0.6 })
for (let k = 0; k < 21; k++) c(T.cascade + k * 0.052 + (k % 3) * 0.008, 'tick', { f: 2200 + (k % 7) * 260, gain: 0.05, p: -0.7 + (k % 7) * 0.23 })
c(T.counts, 'data_stream', { d: 0.6, rate: 34, f: [2400, 3600], gain: 0.045, seed: 71 })
T.glow.forEach((tt, i) => c(tt, 'pluck', { f: [1174.66, 1479.98, 1760.0, 1975.53][i], d: 1.4, gain: 0.08, bright: 0.4, p: -0.3 + i * 0.2, rev: 0.8 }))
c(T.expand, 'whoosh', { d: 0.6, f0: 300, f1: 2600, gain: 0.18, peak: 0.75, rev: 0.3 })
c(T.expandEnd, 'sub', { d: 0.7, f0: 82, f1: 46, gain: 0.32, click: 0.2, rev: 0.3 })

// the pulse: a felt kick on the bar through PROOF, filling in chapter by chapter and building into the
// officer's confirm; it stops dead at Approval, rests on the Locker, then rebuilds through Schemes.
for (let b = Math.ceil(15.0 / BEAT); b * BEAT < T.gather; b++) {
  const t = b * BEAT, beatInBar = b % 4
  if (t >= T.approval - 0.01 && t < T.confirm + BAR) continue          // anticipation → confirm → let it ring
  if (t >= T.rest - 0.01 && t < T.D) continue                            // the locker breath: air only
  if (t >= T.pickA - 0.05 && t < T.prefillA - 0.01) continue             // "Address Change", held still
  if (t >= T.walletB - 0.1 && t < T.chipB - 0.01) continue               // picker + the wallet attach, held still
  if (t >= T.qD - 0.2 && t < T.qDOut + 0.05) continue                    // the ranking, held still under its line
  if (t >= T.howto - 0.1 && t < T.railD - 0.01) continue                 // how-to step 1, held still
  if (t >= T.ringHero - 0.2 && t < T.heroOut + 0.3) continue                 // the gold-ring moment: no percussion
  if (t >= T.days - 0.1 && t < T.E + 0.3) continue                       // the application detail, held still
  if (t >= T.timeE - 0.1 && t < T.gather) continue                       // the resolution timeline, held still
  const dense = t < T.A ? [0] : t < T.B ? [0] : t < T.C ? [0, 2] : t < T.D ? [0, 1, 2, 3] : t < T.E ? (t < T.D + 2.5 ? [0, 2] : [0, 1, 2, 3]) : [0, 2]
  if (!dense.includes(beatInBar)) continue
  const prog = clamp((t - 15) / (T.approval - 15), 0, 1)
  const g = t < T.D ? 0.12 + 0.15 * prog : (t < T.ringHero ? 0.17 + 0.06 * clamp((t - T.D) / 3, 0, 1) : 0.15)   // Act III climbs; after the gold ring it stays under the story
  c(t, 'kick', { d: 0.45, gain: (beatInBar === 0 ? 1 : 0.72) * g, rev: 0.06 })
}
// a pad bed that steps up per chapter and opens its filter toward the confirm
c(T.A, 'chord_pad', { freqs: [73.42, 110.0, 146.83], d: T.B - T.A + 0.4, gain: 0.1, a: 0.8, r: 0.6, cutoff: 800, rev: 0.6 })
c(T.B, 'chord_pad', { freqs: [73.42, 110.0, 146.83, 220.0], d: T.C - T.B + 0.4, gain: 0.12, a: 0.4, r: 0.6, cutoff: 1200, rev: 0.6 })
c(T.C, 'chord_pad', { freqs: [73.42, 110.0, 146.83, 220.0, 293.66], d: T.approval - T.C + 0.2, gain: 0.13, a: 0.4, r: 0.35, cutoff: 1800, rev: 0.6 })
c(T.D, 'chord_pad', { freqs: [73.42, 146.83, 220.0, 293.66, 369.99], d: T.E - T.D + 0.5, gain: 0.14, a: 1.2, r: 0.9, cutoff: 2300, rev: 0.8 })
c(T.B, 'chord_pad', { freqs: [73.42], d: T.gather - T.B + 0.4, gain: 0.05, a: 1.5, r: 1.0, cutoff: 300, rev: 0.3 })   // a low D root under the proof
c(T.pickB + 0.78, 'chord_pad', { freqs: [146.83, 220.0], d: 1.0, gain: 0.05, a: 0.15, r: 0.6, cutoff: 1600, rev: 0.6 })   // the 3/3 still
c(T.qD, 'chord_pad', { freqs: [146.83, 220.0], d: 1.0, gain: 0.05, a: 0.15, r: 0.6, cutoff: 1600, rev: 0.6 })          // the ranked still
for (const t of [T.qB, T.qC, T.D + 0.05]) c(t, 'sub', { d: 0.8, f0: 72, f1: 42, gain: 0.22, click: 0.15, rev: 0.4 })   // soft chapter downbeats
c(T.E, 'chord_pad', { freqs: [73.42, 110.0, 146.83, 220.0, 329.63], d: T.gather - T.E + 0.6, gain: 0.13, a: 0.6, r: 0.9, cutoff: 1900, rev: 0.7 })
c(T.D + 0.4, 'data_stream', { d: T.ringHero - T.D - 0.6, rate: 14, f: [3600, 7200], gain: 0.026, p_spread: 1.0, seed: 81, rev: 0.9 })
c(T.cascadeEnd, 'chord_pad', { freqs: [146.83, 220.0, 293.66], d: 1.8, gain: 0.07, a: 0.35, r: 1.0, cutoff: 1800, rev: 0.7 })   // the catalogue lands

// "handed on" sounds like handed on: soft confirm + an outward pan, never a stamp on an assisted service
const handedOn = (t) => { c(t, 'tick', { f: 2100, gain: 0.1 }); c(t + 0.01, 'pluck', { f: 880.0, d: 1.2, gain: 0.07, bright: 0.4, rev: 0.6 }) }
const dockNote = (t, k) => { c(t, 'pluck', { f: ORDER[k] * 2, d: 1.9, gain: 0.14, bright: 0.5, p: 0.5, rev: 0.75 }) }

// ── A · Driving Licence ──
c(T.listA, 'tick', { f: 1900, gain: 0.08 })
for (let k = 0; k < 4; k++) c(T.listA + 0.2 + k * 0.1, 'tick', { f: 2800 + k * 120, d: 0.02, gain: 0.03 })
c(T.pickA, 'tick', { f: 2300, gain: 0.11 }); c(T.pickA, 'pluck', { f: 587.33, d: 0.9, gain: 0.09, bright: 0.5, rev: 0.4 })
c(T.prefillA, 'data_stream', { d: 0.35, rate: 30, f: [2200, 3200], gain: 0.045, seed: 31 })
for (let k = 0; k < 4; k++) c(T.prefillA + k * 0.08, 'tick', { f: 2500 + k * 140, d: 0.03, gain: 0.05, p: -0.3 + k * 0.2 })   // the four fields fill
handedOn(T.ackA); c(T.ackA, 'chord_pad', { freqs: [293.66, 369.99, 440.0, 587.33], d: 1.3, gain: 0.09, a: 0.02, r: 1.0, cutoff: 2800, rev: 0.7 }); c(T.ackA + 0.02, 'pluck', { f: 1174.66, d: 1.4, gain: 0.1, bright: 0.5, rev: 0.6 })   // the first reference: confirmed
c(T.qrA - 0.2, 'data_stream', { d: 0.4, rate: 70, f: [3000, 5200], gain: 0.04, seed: 41 })
c(T.handA, 'sub', { d: 0.4, f0: 90, f1: 55, gain: 0.12, click: 0.1, rev: 0.3 }); c(T.handA, 'pluck', { f: 739.99, d: 1.0, gain: 0.07, bright: 0.4, p: 0.3, rev: 0.6 }); c(T.handA + 0.16, 'pluck', { f: 987.77, d: 1.2, gain: 0.06, bright: 0.4, p: 0.6, rev: 0.6 })   // handed on
c(T.handA + 0.3, 'whoosh', { d: 0.7, f0: 600, f1: 2200, gain: 0.08, p0: -0.2, p1: 0.9, peak: 0.6, rev: 0.4 })
c(T.dockA, 'whoosh', { d: 0.4, f0: 900, f1: 2800, gain: 0.08, p0: -0.3, p1: 0.7, peak: 0.7 })
dockNote(T.dockAEnd, 0)
c(T.dockAEnd + 0.3, 'whoosh', { d: 0.9, f0: 1600, f1: 240, gain: 0.1, peak: 0.4, rev: 0.4 })

// ── B · Ration Card ── (its own signature: the wallet attach is a warm chord, not a stamp)
c(T.walletB - 0.1, 'tick', { f: 2100, gain: 0.12 })
c(T.pickB, 'tick', { f: 2400, gain: 0.13 })
c(T.pickB + 0.12, 'chord_pad', { freqs: [329.63, 415.3, 493.88, 659.25], d: 1.3, gain: 0.09, a: 0.02, r: 1.0, cutoff: 3000, rev: 0.7 })
c(T.pickB + 0.14, 'pluck', { f: 1318.51, d: 1.6, gain: 0.08, bright: 0.5, rev: 0.6 })
handedOn(T.chipB); c(T.chipB, 'sub', { d: 0.4, f0: 90, f1: 55, gain: 0.12, click: 0.1, rev: 0.3 }); c(T.chipB, 'chord_pad', { freqs: [329.63, 415.3, 493.88], d: 1.0, gain: 0.07, a: 0.02, r: 0.8, cutoff: 3200, rev: 0.7 }); c(T.chipB + 0.16, 'pluck', { f: 1174.66, d: 1.2, gain: 0.05, bright: 0.4, p: 0.6, rev: 0.6 })
c(T.dockB + 0.05, 'pluck', { f: ORDER[1] * 2, d: 1.6, gain: 0.08, bright: 0.4, p: 0.4, rev: 0.75 })   // the reference settles (no dock)

// ── C · Birth Certificate ──
c(T.formC + 0.2, 'data_stream', { d: 0.5, rate: 26, f: [2200, 3400], gain: 0.04, seed: 33 })
c(T.chipC, 'tick', { f: 2300, gain: 0.12 }); c(T.chipC, 'pluck', { f: 739.99, d: 1.0, gain: 0.08, bright: 0.5, rev: 0.5 })
c(T.spine - 0.05, 'whoosh', { d: 0.6, f0: 2400, f1: 300, gain: 0.12, p0: 0.3, p1: 0, peak: 0.4 })
T.stages.forEach((tt, i) => c(tt, 'pluck', { f: HI[i], d: 0.5, gain: 0.05 + i * 0.008, bright: 0.4, p: 0.2, rev: 0.4 }))
c(T.officer + 0.05, 'whoosh', { d: 0.4, f0: 900, f1: 2000, gain: 0.06, p0: 0.8, p1: 0.4, peak: 0.6 })
c(T.spine, 'chord_pad', { freqs: [146.83, 220.0, 293.66], d: T.approval - T.spine + 0.02, gain: 0.07, a: 0.85, r: 0.05, cutoff: 1500, rev: 0.4 })   // two bars of build into the officer
c(T.officerEnd, 'air', { d: T.confirm - T.officerEnd, gain: 0.004, rev: 0.2 })   // then near-silence: the decision lands out of quiet
c(T.confirm, 'stamp', { gain: 0.28, rev: 0.5 })                      // the film's only stamp: a human decision
c(T.confirm, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 440.0], d: 1.5, gain: 0.1, a: 0.02, r: 1.1, cutoff: 2400, rev: 0.6 })
c(T.confirm + 0.01, 'pluck', { f: 1174.66, d: 1.4, gain: 0.1, bright: 0.5, rev: 0.6 }); c(T.confirm + 0.13, 'pluck', { f: 1760.0, d: 1.4, gain: 0.08, bright: 0.5, rev: 0.6 })
T.stages2.forEach((tt, i) => c(tt + 0.01, 'tick', { f: 2400 + i * 240, gain: 0.07, p: 0.1 }))
for (let k = 0; k < 3; k++) c(T.flap + k * 0.11, 'tick', { f: 1100 - k * 80, d: 0.04, gain: 0.14, p: -0.3 })
c(T.cert, 'whoosh', { d: 0.68, f0: 500, f1: 2600, gain: 0.14, p0: 0.4, p1: -0.5, peak: 0.75 })
c(T.seat, 'sub', { d: 0.6, f0: 130, f1: 70, gain: 0.18, click: 0.6, rev: 0.3 })
c(T.seat + 0.01, 'pluck', { f: 1318.51, d: 2.2, gain: 0.09, bright: 0.45, rev: 0.9 }); c(T.seat + 0.08, 'pluck', { f: 1975.53, d: 2.2, gain: 0.06, bright: 0.4, rev: 0.9 })
c(T.seat + 0.1, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 369.99], d: 1.4, gain: 0.07, a: 0.1, r: 0.9, cutoff: 1800, rev: 0.8 })
dockNote(T.dockCEnd, 2); c(T.dockCEnd, 'chord_pad', { freqs: [293.66, 369.99, 440.0, 587.33], d: 1.1, gain: 0.07, a: 0.02, r: 0.9, cutoff: 3600, rev: 0.7 })
c(T.completeC, 'pluck', { f: 1479.98, d: 1.2, gain: 0.08, bright: 0.4, p: 0.6, rev: 0.7 })
c(T.D - 0.45, 'whoosh', { d: 1.0, f0: 1600, f1: 220, gain: 0.1, peak: 0.45, rev: 0.4 })

// ── D · Schemes → a tangible benefit → the tracked prerequisite ──
c(T.suggest, 'tick', { f: 2300, gain: 0.1 }); c(T.suggest + 0.02, 'pluck', { f: 1174.66, d: 1.2, gain: 0.08, bright: 0.4, rev: 0.7 })
c(T.page - 0.17, 'whoosh', { d: 0.5, f0: 500, f1: 3000, gain: 0.11, peak: 0.6 })
c(T.bars, 'riser', { d: T.barsEnd - T.bars, f0: 1200, f1: 6000, gain: 0.045, rev: 0.5 })
for (let k = 0; k < 3; k++) c(T.bars + 0.3 + k * 0.05, 'tick', { f: 2600 + k * 220, d: 0.03, gain: 0.06, p: -0.4 + k * 0.4 })
c(T.focusD, 'pluck', { f: 880.0, d: 1.6, gain: 0.1, bright: 0.5, rev: 0.7 })
// THE MOMENT: the velocity drops; a warm held chord, the ring drawn as a rising shimmer, one glint
c(T.ringHero - 0.1, 'whoosh', { d: 0.6, f0: 2400, f1: 500, gain: 0.06, peak: 0.4, rev: 0.6 })
c(T.ringHero, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 369.99, 440.0], d: T.heroOut - T.ringHero + 0.9, gain: 0.09, a: 0.6, r: 0.9, cutoff: 2200, rev: 0.9 })
c(T.ringHero + 0.05, 'pluck', { f: 1174.66, d: 2.0, gain: 0.08, bright: 0.3, rev: 1.0 })
c(T.heroRing, 'data_stream', { d: 0.75, rate: 36, f: [3200, 6400], gain: 0.03, p_spread: 0.6, seed: 91, accel: 1.4, rev: 0.8 })
c(T.heroRing, 'sub', { d: 1.4, f0: 70, f1: 40, gain: 0.3, click: 0.1, rev: 0.5 }); c(T.heroRing + 0.75, 'pluck', { f: 1760.0, d: 2.4, gain: 0.09, bright: 0.25, rev: 1.0 })
c(T.heroGlint, 'pluck', { f: 2349.32, d: 3.0, gain: 0.12, bright: 0.16, p: 0.3, rev: 1.0 }); c(T.heroGlint + 0.03, 'pluck', { f: 3520.0, d: 2.6, gain: 0.05, bright: 0.1, p: 0.4, rev: 1.0 })   // the glint, with the glint
c(T.heroOut, 'whoosh', { d: 0.5, f0: 500, f1: 1800, gain: 0.05, peak: 0.6 })
c(T.howto, 'tick', { f: 2200, gain: 0.1 }); c(T.howto + 0.02, 'pluck', { f: 1174.66, d: 1.0, gain: 0.07, bright: 0.4, rev: 0.6 })
c(T.linkD, 'riser', { d: 0.35, f0: 1500, f1: 4500, gain: 0.04 })
dockNote(T.linkD + 0.35, 3)
c(T.track - 0.02, 'whoosh', { d: 0.45, f0: 700, f1: 2600, gain: 0.09, peak: 0.6 })
c(T.days, 'pluck', { f: 440.0, d: 1.8, gain: 0.13, bright: 0.3, rev: 0.7 }); c(T.days + 0.06, 'pluck', { f: 880.0, d: 1.8, gain: 0.08, bright: 0.3, rev: 0.7 })

// ── E · Complaint filing: report, routed, referenced, followed ──
c(T.E - 0.3, 'whoosh', { d: 0.4, f0: 600, f1: 2600, gain: 0.08, peak: 0.85, rev: 0.4 })
c(T.E + 0.05, 'sub', { d: 0.8, f0: 72, f1: 42, gain: 0.22, click: 0.15, rev: 0.4 })
c(T.catE, 'tick', { f: 2300, gain: 0.11 }); c(T.catE + 0.01, 'pluck', { f: 880.0, d: 1.0, gain: 0.07, bright: 0.4, rev: 0.5 })
for (let k = 0; k < 3; k++) c(T.routeE + k * 0.08, 'tick', { f: 2800 + k * 200, d: 0.03, gain: 0.06, p: 0.3 + k * 0.15 })
c(T.routeE + 0.2, 'chord_pad', { freqs: [293.66, 440.0], d: 0.9, gain: 0.045, a: 0.05, r: 0.7, cutoff: 2600, rev: 0.6 })   // routed
c(T.descE, 'type_keys', { text_len: 26, d: T.areaE - T.descE - 0.15, gain: 0.06, seed: 7 })
c(T.areaE, 'tick', { f: 2000, gain: 0.07 })
c(T.submitE, 'tick', { f: 2100, gain: 0.12 })
c(T.filedE, 'sub', { d: 0.4, f0: 90, f1: 55, gain: 0.12, click: 0.1, rev: 0.3 })
c(T.filedE, 'chord_pad', { freqs: [293.66, 369.99, 440.0, 587.33], d: 1.2, gain: 0.09, a: 0.02, r: 0.9, cutoff: 3000, rev: 0.7 }); c(T.filedE + 0.02, 'pluck', { f: 1174.66, d: 1.4, gain: 0.1, bright: 0.5, rev: 0.6 })
c(T.refE, 'data_stream', { d: 0.3, rate: 60, f: [3000, 5200], gain: 0.035, seed: 47 })
c(T.timeE, 'whoosh', { d: 0.45, f0: 600, f1: 2200, gain: 0.06, peak: 0.6 }); c(T.timeE + 0.1, 'pluck', { f: 659.25, d: 1.6, gain: 0.08, bright: 0.3, rev: 0.7 })

// ── ACT IV · one record → one constituency (localized, precise) ──
c(T.reg - 0.4, 'reverse_swell', { d: 0.45, f: 220.0, gain: 0.09, rev: 0.4 }); c(T.reg, 'tick', { f: 1400, gain: 0.08 })
c(T.reg, 'whoosh', { d: 0.5, f0: 1800, f1: 500, gain: 0.07, p0: 0.5, p1: 0, peak: 0.5, rev: 0.4 })
c(T.gather - 0.05, 'reverse_swell', { d: T.iris - T.gather + 0.35, f: 146.83, gain: 0.22, rev: 0.5 })
for (let k = 0; k < 5; k++) c(T.dots + k * 0.08, 'pluck', { f: [1760.0, 1479.98, 1318.51, 1174.66, 880.0][k], d: 0.9, gain: 0.06, bright: 0.3, p: 0.5 - k * 0.25, rev: 0.6 })
c(T.iris, 'whoosh', { d: 0.75, f0: 3000, f1: 200, gain: 0.11, p0: -0.3, p1: 0.3, peak: 0.55, rev: 0.5 })
c(T.hit, 'sub', { d: 1.2, f0: 66, f1: 36, gain: 0.24, click: 0.15, rev: 0.5 })
c(T.plate, 'whoosh', { d: 0.4, f0: 300, f1: 1800, gain: 0.09, peak: 0.85 })
T.rolls.forEach((tt, i) => { c(tt, 'tick', { f: 1500 + i * 120, gain: 0.13 }); c(tt, 'pluck', { f: [587.33, 659.25, 739.99][i], d: 1.2, gain: 0.1, bright: 0.3, rev: 0.6 }) })
c(T.rollDone, 'tick', { f: 1900, gain: 0.13 }); c(T.rollDone, 'pluck', { f: 880.0, d: 1.4, gain: 0.11, bright: 0.3, rev: 0.6 })
c(T.rollPend, 'tick', { f: 1300, gain: 0.09 }); c(T.rollPend + 0.1563, 'tick', { f: 1360, gain: 0.08 })
c(T.plate, 'chord_pad', { freqs: [73.42, 110.0, 146.83], d: T.lineOut - T.plate + 0.6, gain: 0.08, a: 0.5, r: 0.6, cutoff: 900, rev: 0.6 })

// ── ACT V · the line travels; replication; scale; the portrait; மாற்றம்; the identity ──
c(T.lineOut, 'riser', { d: T.viru - T.lineOut, f0: 400, f1: 1800, gain: 0.05, tone: 293.66, rev: 0.6 })
c(T.lineOut + 0.15, 'whoosh', { d: T.viru - T.lineOut - 0.15, f0: 500, f1: 2600, gain: 0.12, p0: 0.3, p1: -0.6, peak: 0.7, rev: 0.5 })   // directional: west to Virugambakkam
const arrive = (t, k, g, sg) => {   // a distinct, elegant confirmation per constituency; Virugambakkam is privileged
  c(t, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 369.99], d: k ? 1.8 : 2.4, gain: g, a: 0.02, r: 1.6, cutoff: 2600, rev: 0.8 })
  c(t, 'pluck', { f: [987.77, 1318.51, 1479.98][k], d: 2.0, gain: [0.12, 0.08, 0.068][k], bright: 0.5, rev: 0.8 }); c(t + 0.07, 'pluck', { f: [1479.98, 1975.53, 2217.46][k], d: 1.8, gain: [0.08, 0.05, 0.042][k], bright: 0.4, rev: 0.8 })
  c(t, 'sub', { d: 0.7, f0: 80, f1: 48, gain: sg, click: 0.2, rev: 0.4 })
}
const tilesTick = (t, g) => { for (let k = 0; k < 3; k++) c(t + k * 0.06, 'tick', { f: 2400 + k * 260, d: 0.03, gain: g, p: -0.3 + k * 0.3 }) }
arrive(T.viru, 0, 0.1, 0.2); tilesTick(T.viru + 0.4, 0.06); c(T.viru + 0.8, 'tick', { f: 3000, gain: 0.05 })
c(T.viruHold, 'whoosh', { d: T.villi - T.viruHold, f0: 600, f1: 2400, gain: 0.1, p0: -0.4, p1: 0.4, peak: 0.7, rev: 0.4 })
arrive(T.villi, 1, 0.06, 0.16); tilesTick(T.villi + 0.4, 0.042)
c(T.villiHold, 'whoosh', { d: T.tnagar - T.villiHold, f0: 600, f1: 2400, gain: 0.1, p0: 0.3, p1: -0.1, peak: 0.7, rev: 0.4 })
arrive(T.tnagar, 2, 0.06, 0.12); tilesTick(T.tnagar + 0.4, 0.042)
{ const KT = [T.viruHold, T.villi, T.villi + 0.6, T.villi + 1.1, T.tnagar, T.tnagar + 0.5, T.pull, T.pull + 0.425, T.pull + 0.825, T.pull + 1.195, T.pull + 1.545, T.pull + 1.875, T.pull + 2.175]   // an accelerating grid that lands on each constituency
  KT.forEach((t, n) => { if (t < T.count234End - 0.3) c(t, 'kick', { d: 0.4, gain: 0.10 + 0.17 * n / (KT.length - 1), rev: 0.05 }) }) }
// the pull-back: width, depth, scale
c(T.pull, 'riser', { d: T.count234End - T.pull - 0.15, f0: 160, f1: 1400, gain: 0.14, tone: 146.83, rev: 0.6 })
c(T.pull, 'whoosh', { d: 2.2, f0: 2800, f1: 180, gain: 0.11, peak: 0.65, rev: 0.7 })   // crests under the widening frame
c(T.pull + 0.2, 'chord_pad', { freqs: [55.0, 73.42, 110.0, 146.83, 220.0, 329.63], d: T.count234End - T.pull - 0.25, gain: 0.22, a: 0.6, r: 1.2, cutoff: 1600, rev: 0.9 })
c(T.ring, 'data_stream', { d: Math.min(T.ringEnd - T.ring, T.count234End - 0.15 - T.ring), rate: 46, f: [1800, 4500], gain: 0.03, p_spread: 1.0, seed: 52, accel: 0.8, rev: 0.8 })
for (let k = 0; k < 16; k++) { const u = 1 - Math.pow(1 - k / 16, 1 / 3); c(T.count234 + u * (T.count234End - T.count234 - 0.05), 'tick', { f: 2200 + (k % 6) * 300, d: 0.03, gain: 0.04, p: -0.8 + (k % 9) * 0.2 }) }   // the count, decelerating with the numeral
for (const u of [0.72, 0.85]) c(T.count234 + u * (T.count234End - T.count234), 'tick', { f: 2600, d: 0.03, gain: 0.03, p: 0 })   // the last counts are heard; then a 150 ms breath
c(T.count234End, 'sub', { d: 1.6, f0: 60, f1: 34, gain: 0.42, click: 0.5, rev: 0.7 }); c(T.count234End, 'boom_air', { d: 2.6, gain: 0.15, rev: 0.8 })
c(T.count234End, 'pluck', { f: 1174.66, d: 2.4, gain: 0.11, bright: 0.35, rev: 1.0 }); c(T.count234End + 0.05, 'pluck', { f: 1760.0, d: 2.4, gain: 0.07, bright: 0.35, rev: 1.0 })
c(T.count234End, 'chord_pad', { freqs: [73.42, 146.83, 220.0, 293.66, 369.99, 440.0], d: 2.2, gain: 0.24, a: 0.05, r: 2.0, cutoff: 2400, rev: 0.9 })   // the whole state
// red + gold, then the portrait forms: percussion falls away; tension and anticipation
c(T.red, 'reverse_swell', { d: T.form - T.red, f: 110.0, gain: 0.12, rev: 0.6 })   // lands on the portrait's first stage
c(T.red + 0.2, 'drone', { d: T.reveal - T.red + 1.8, f: 36.71, gain: 0.08, cutoff: 200, rev: 0.4 })
c(T.redEnd - 0.3, 'riser', { d: T.reveal - T.redEnd + 0.9, f0: 100, f1: 900, gain: 0.06, tone: 110.0, rev: 0.6 })
for (const [t, g] of [[T.form + 0.55, 0.12], [T.form + 1.8, 0.16], [T.form + 3.05, 0.2]]) c(t, 'sub', { d: 0.9, f0: 70, f1: 44, gain: g, click: 0.05, rev: 0.5 })
c(T.form + 0.2, 'data_stream', { d: T.reveal - T.form, rate: 30, f: [3600, 7600], gain: 0.03, p_spread: 1.0, seed: 61, accel: 1.0, rev: 0.9 })
// the grand reveal: authority, not a trailer hit
c(T.reveal, 'air', { d: 1.6, gain: 0.03, rev: 0.6 })
c(T.faceWhole - 1.4, 'chord_pad', { freqs: [73.42, 146.83, 185.0, 220.0, 293.66, 369.99, 440.0], d: 4.2, gain: 0.23, a: 1.1, r: 2.2, cutoff: 2600, rev: 0.9 })   // authority by harmony, not a hit
c(T.faceWhole - 0.9, 'reverse_swell', { d: 0.6, f: 146.83, gain: 0.1, rev: 0.6 })
c(T.faceWhole - 0.3, 'sub', { d: 2.4, f0: 58, f1: 34, gain: 0.3, click: 0.1, rev: 0.6 })
c(T.faceWhole - 0.25, 'pluck', { f: 587.33, d: 2.6, gain: 0.15, bright: 0.4, rev: 1.0 }); c(T.faceWhole - 0.18, 'pluck', { f: 880.0, d: 2.6, gain: 0.09, bright: 0.4, rev: 1.0 })
c(T.goldWipe, 'chord_pad', { freqs: [146.83, 293.66, 369.99, 440.0], d: 2.4, gain: 0.08, a: 0.6, r: 1.4, cutoff: 3000, rev: 0.9 }); c(T.goldWipe, 'sub', { d: 1.2, f0: 62, f1: 40, gain: 0.12, click: 0.05, rev: 0.5 })
c(T.goldWipeEnd - 0.3, 'chord_pad', { freqs: [146.83, 220.0], d: T.lineBack + 0.6 - T.goldWipeEnd + 0.3, gain: 0.04, a: 0.6, r: 0.8, cutoff: 900, rev: 0.7 })   // a quiet floor under the held yellow reference
c(T.goldWipe, 'pluck', { f: 1318.51, d: 2.4, gain: 0.07, bright: 0.35, rev: 1.0 }); c(T.goldWipe + 0.35, 'pluck', { f: 1975.53, d: 2.4, gain: 0.065, bright: 0.35, rev: 1.0 }); c(T.goldWipe, 'data_stream', { d: T.goldWipeEnd - T.goldWipe, rate: 26, f: [4000, 8000], gain: 0.025, p_spread: 1.0, seed: 71, rev: 0.9 })   // red turns gold
// the line re-emerges; the soundscape pulls back for மாற்றம்
c(T.lineBack, 'whoosh', { d: T.maatram - T.lineBack, f0: 700, f1: 2200, gain: 0.07, p0: 0.5, p1: -0.5, peak: 0.6, rev: 0.6 })
c(T.lineBack, 'riser', { d: T.maatram - T.lineBack, f0: 1400, f1: 2800, gain: 0.025, rev: 0.7 })
c(T.maatram, 'pluck', { f: 587.33, d: 3.0, gain: 0.06, bright: 0.25, rev: 1.0 }); [0.569, 0.732, 0.854, 0.975].forEach((o, i) => c(T.maatram + o, 'pluck', { f: [1174.66, 1318.51, 1479.98, 1760.0][i], d: 1.6, gain: 0.018, bright: 0.15, p: -0.25 + 0.15 * i, rev: 0.9 })); c(T.maatram + 1.4, 'pluck', { f: 880.0, d: 2.4, gain: 0.06, bright: 0.25, rev: 1.0 })   // the word fills
c(T.maatram + 0.2, 'drone', { d: T.scram + 0.3 - T.maatram - 0.2, f: 36.71, gain: 0.025, cutoff: 180, rev: 0.3 })   // மாற்றம்: almost still
c(T.maatram, 'air', { d: T.scram - T.maatram, gain: 0.012, rev: 0.3 })
// the evolution: granular ticks on every Tamil cluster change, delicate metallic glints, soft tonal pulses; tension builds, never a glitch
{ const PAN = [-0.3, 0, 0.3]; let js = 7; const jr = () => { js = (js * 16807) % 2147483647; return js / 2147483647 }
  for (const f of SCR.frames) {
    const changed = SCR.plans.filter((p) => p.steps.some((x) => Math.abs(x.t - f.t) < 1e-6)), lock = changed.some((p) => p.steps.find((x) => Math.abs(x.t - f.t) < 1e-6).lock)
    const u = clamp((f.t - T.scram) / (T.scramEnd - T.scram), 0, 1), pn = changed.reduce((a2, p) => a2 + PAN[p.slot], 0) / Math.max(1, changed.length), fc = 3600 - 1100 * u   // the cluster centre glides down as the word converges
    { let at = f.t; for (let g2 = 0; g2 < 3; g2++) { if (g2 === 0 && (Math.round(f.t * 30) % 2)) { at += 0.004; continue } c(at, 'tick', { f: fc * [1, 1.09, 0.94][g2] * Math.pow(2, (jr() - 0.5) * 0.25), d: 0.012, gain: 0.022, p: pn }); at += 0.005 + 0.006 * jr() } }
    if (lock) { const sl = changed.find((p) => p.steps.find((x) => Math.abs(x.t - f.t) < 1e-6).lock).slot; if (sl < 2) c(f.t, 'pluck', { f: [1174.66, 1318.51][sl], d: 1.2, gain: 0.05, bright: 0.25, p: PAN[sl], rev: 0.8 }); else c(f.t, 'pluck', { f: 880.0, d: 1.0, gain: 0.035, bright: 0.2, rev: 0.8 }) }
  }
  { const ST = [SCR.plans[1].start, SCR.plans[2].start, ...SCR.plans.map((p) => p.lock)]; ST.forEach((t, n) => c(t, 'pluck', { f: 146.83, d: 0.4, gain: 0.05 + 0.005 * n, bright: 0.08, rev: 0.4 }))
    const famT = SCR.plans[1].steps.find((x) => ['ன', 'னி', 'னீ'].includes(x.g)); if (famT) c(famT.t, 'pluck', { f: 146.83, d: 0.4, gain: 0.05, bright: 0.08, rev: 0.4 }) }   // the word first finds its family: a soft pulse in the middle
  c(T.scram, 'riser', { d: T.scramEnd - T.scram, f0: 600, f1: 2400, gain: 0.045, rev: 0.6 })
}
// முன்னேற்றம் resolves: everything snaps into clarity — one refined, gold-toned harmonic resolve
c(T.scramEnd, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 369.99, 440.0, 587.33, 739.99], d: T.munLine - T.scramEnd - 0.1, gain: 0.24, a: 0.03, r: 2.2, cutoff: 3400, rev: 0.9 })
c(T.scramEnd, 'pluck', { f: 1479.98, d: 2.8, gain: 0.1, bright: 0.3, rev: 1.0 }); c(T.scramEnd + 0.06, 'pluck', { f: 2349.32, d: 3.2, gain: 0.06, bright: 0.25, rev: 1.0 })   // F#6 + a D7 bell: its own colour
c(T.scramEnd, 'sub', { d: 1.8, f0: 64, f1: 40, gain: 0.26, click: 0.06, rev: 0.5 })
// the line grows outward: a very subtle spatial sweep
c(T.munLine, 'whoosh', { d: 0.75, f0: 1500, f1: 5200, gain: 0.075, p0: 0, p1: -0.8, peak: 0.45, rev: 0.6 }); c(T.munLine, 'whoosh', { d: 0.75, f0: 1500, f1: 5200, gain: 0.075, p0: 0, p1: 0.8, peak: 0.45, rev: 0.6 })
// A SMALL STEP TOWARDS: near silence
c(T.step, 'air', { d: T.identity - T.step, gain: 0.018, rev: 0.2 }); c(T.step + 0.05, 'pluck', { f: 2349.32, d: 1.8, gain: 0.03, bright: 0.12, rev: 0.9 })
c(T.identity - 0.8, 'reverse_swell', { d: 1.0, f: 146.83, gain: 0.15, rev: 0.5 })   // the answer is anticipated, not a jolt
c(T.identity, 'tick', { f: 2200, d: 0.03, gain: 0.05 }); c(T.identity, 'pluck', { f: 2349.32, d: 1.6, gain: 0.035, bright: 0.15, rev: 0.9 })   // the line lands
// the identity: one clean, memorable resolution
c(T.identity + 0.2, 'sub', { d: 3.0, f0: 62, f1: 36, gain: 0.2, click: 0.04, rev: 0.6 })
c(T.identity + 0.2, 'chord_pad', { freqs: [73.42, 146.83, 220.0, 293.66, 369.99, 493.88], d: 4.6, gain: 0.15, a: 0.6, r: 3.4, cutoff: 2800, rev: 0.9 })
c(T.idWord, 'pluck', { f: 1174.66, d: 2.6, gain: 0.085, bright: 0.28, rev: 1.0 }); c(T.idSuper, 'pluck', { f: 1760.0, d: 2.4, gain: 0.065, bright: 0.25, rev: 1.0 }); c(T.idTa, 'pluck', { f: 2349.32, d: 2.4, gain: 0.05, bright: 0.22, rev: 1.0 })

fs.writeFileSync(new URL('../film2/cues.json', import.meta.url), JSON.stringify({ bpm: BPM, dur: DUR, reverb: 2.8, cues }, null, 1))
const beats = []
for (let b = 0; b * BEAT < DUR - 1e-6; b++) beats.push(+(b * BEAT).toFixed(4))
fs.writeFileSync(new URL('../film2/beats.json', import.meta.url), JSON.stringify({ bpm: BPM, beat: BEAT, bar: BAR, beats, downbeats: beats.filter((_, i) => i % 4 === 0), events: Object.fromEntries(Object.entries(T).filter(([, v]) => typeof v === 'number')) }, null, 1))
console.log(cues.length, 'cues;', beats.length, 'beats')

// Build film/cues.json (sound cue sheet) and film/beats.json from the picture timeline.
import fs from 'node:fs'
import { T, BPM, BEAT, BAR, S16, S8, DUR } from '../film/timeline.js'

const cues = []
const c = (t, type, o = {}) => cues.push({ t: +t.toFixed(4), type, ...o })
// D major pentatonic (the "order" scale) and out-of-key cluster (the "problem")
const ORDER = [587.33, 659.25, 739.99, 880.0, 987.77]
const CLUSTER = [622.25, 415.3, 932.33, 523.25, 830.61]

// bed
c(0, 'drone', { d: DUR, gain: 0.07, rev: 0.2 })

// BAR 1 — the state
c(T.impact, 'sub', { d: 2.6, f0: 62, f1: 33, gain: 1.0, click: 0.6, rev: 0.5 })
c(T.impact, 'boom_air', { d: 3.2, gain: 0.55, rev: 0.6 })
c(T.impact, 'pluck', { f: 1760, d: 2.0, gain: 0.12, bright: 0.4, rev: 0.9 })
c(T.impact + 0.05, 'data_stream', { d: 2.0, rate: 46, f: [2600, 6200], gain: 0.07, p_spread: 0.9, seed: 3, accel: -0.6, rev: 0.5 })
for (let k = 0; k < 3; k++) c(T.districts + k * S8, 'pluck', { f: [2349.3, 2637.0, 2959.9][k], d: 1.2, gain: 0.06, bright: 0.3, p: [-0.4, 0.3, 0.6][k], rev: 0.9 })

// BAR 2 — dive, the question, the problem
c(T.dive - 0.05, 'whoosh', { d: 0.62, f0: 180, f1: 3200, gain: 0.32, p0: 0.5, p1: -0.2, peak: 0.85, rev: 0.4 })
c(T.diveEnd, 'sub', { d: 0.9, f0: 90, f1: 48, gain: 0.45, click: 0.3, rev: 0.4 })
c(T.bubble + 0.03, 'pluck', { f: 587.33, d: 1.0, gain: 0.16, bright: 0.7, rev: 0.6 })
c(T.bubble + 0.03, 'tick', { f: 2600, gain: 0.12 })
T.tiles.forEach((tt, i) => c(tt, 'pluck', { f: CLUSTER[i], d: 1.3, gain: 0.13, bright: 1.1, p: [0.5, -0.6, 0.6, -0.4, 0.2][i], rev: 0.5 }))
c(T.wrong, 'riser', { d: T.snap - T.wrong, f0: 260, f1: 3800, gain: 0.2, tone: 220, rev: 0.3 })
c(T.knot, 'data_stream', { d: T.snap - T.knot, rate: 30, f: [1800, 3600], gain: 0.06, seed: 9, accel: 2.5, rev: 0.2 })

// BAR 3 — the snap, the order
c(T.snap - 0.02, 'whoosh', { d: 0.22, f0: 4000, f1: 600, gain: 0.3, p0: 0.8, p1: -0.8, peak: 0.25, rev: 0.3 })
c(T.snap, 'sub', { d: 2.2, f0: 70, f1: 36, gain: 0.85, click: 0.8, rev: 0.5 })
c(T.snap, 'chord_pad', { freqs: [73.42, 110.0, 146.83, 220.0], d: 2.6, gain: 0.16, a: 0.04, r: 1.6, cutoff: 1400, rev: 0.6 })
c(T.snap + 0.03, 'tick', { f: 3200, gain: 0.1, p: 0.2 })
c(T.snap + 0.15, 'tick', { f: 2800, gain: 0.07, p: -0.2 })
c(T.hero, 'data_stream', { d: 0.7, rate: 22, f: [3500, 7000], gain: 0.04, seed: 21, rev: 0.7 })
T.rows.forEach((tt, i) => c(tt, 'pluck', { f: ORDER[i], d: 1.6, gain: 0.17, bright: 0.8, p: -0.3 + i * 0.15, rev: 0.6 }))
c(T.rows[4] + 0.02, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 369.99], d: 1.6, gain: 0.08, a: 0.25, r: 0.9, cutoff: 2000, rev: 0.7 })
c(T.flip - 0.02, 'whoosh', { d: 0.45, f0: 400, f1: 2600, gain: 0.14, p0: 0.6, p1: -0.4, peak: 0.6 })

// BAR 4 — press, push through, stepper
c(T.press, 'tick', { f: 2300, gain: 0.22 })
c(T.press, 'sub', { d: 0.4, f0: 140, f1: 80, gain: 0.25, click: 0.5, rev: 0.2 })
c(T.press + 0.02, 'riser', { d: T.pushEnd - T.press, f0: 400, f1: 7000, gain: 0.28, rev: 0.2 })
c(T.pushEnd, 'whoosh', { d: 0.55, f0: 5000, f1: 300, gain: 0.22, p0: 0, p1: 0, peak: 0.08, rev: 0.4 })
c(T.pushEnd, 'sub', { d: 0.8, f0: 80, f1: 45, gain: 0.4, click: 0.2, rev: 0.4 })
const STEPN = [1174.66, 1318.51, 1479.98, 1760.0, 1975.53, 2349.32, 2637.02]
T.steps.forEach((tt, i) => c(tt, 'pluck', { f: STEPN[i], d: 0.6, gain: 0.07, bright: 0.5, p: -0.5 + i * 0.16, rev: 0.4 }))
c(T.prefill, 'data_stream', { d: 0.3, rate: 30, f: [2200, 3200], gain: 0.05, seed: 31 })
c(T.submitGrow, 'whoosh', { d: 0.32, f0: 600, f1: 3000, gain: 0.12, peak: 0.9 })

// BAR 5 — receipt, workflow
c(T.ack, 'stamp', { gain: 0.55, rev: 0.5 })
c(T.ack + 0.02, 'pluck', { f: 880.0, d: 1.8, gain: 0.12, bright: 0.6, rev: 0.7 })
c(T.ack + 0.06, 'pluck', { f: 1174.66, d: 1.8, gain: 0.09, bright: 0.6, rev: 0.7 })
c(T.qr, 'data_stream', { d: T.qrEnd - T.qr, rate: 70, f: [3000, 5200], gain: 0.05, seed: 41 })
c(T.spine - 0.05, 'whoosh', { d: 0.6, f0: 2400, f1: 300, gain: 0.16, p0: 0.3, p1: 0.0, peak: 0.4 })
for (let k = 0; k < 4; k++) c(T.spine + k * S8, 'pulse', { f: 52, d: 0.35, gain: 0.32 + k * 0.05, rev: 0.1 })
T.stages.forEach((tt, i) => c(tt, 'pluck', { f: [1174.66, 1318.51, 1479.98, 1760.0, 1975.53, 2349.32][i], d: 0.5, gain: 0.07, bright: 0.4, p: 0.2, rev: 0.4 }))

// BAR 6 — silence, the decision, delivery
c(T.officer + 0.05, 'whoosh', { d: 0.4, f0: 900, f1: 2000, gain: 0.07, p0: 0.8, p1: 0.4, peak: 0.6 })
c(T.confirm, 'stamp', { gain: 0.62, rev: 0.5 })
c(T.confirm, 'chord_pad', { freqs: [146.83, 220.0, 293.66, 440.0], d: 1.5, gain: 0.12, a: 0.02, r: 1.1, cutoff: 2400, rev: 0.6 })
c(T.confirm + 0.01, 'pluck', { f: 1174.66, d: 1.4, gain: 0.12, bright: 0.5, rev: 0.6 })
c(T.confirm + 0.13, 'pluck', { f: 1760.0, d: 1.4, gain: 0.1, bright: 0.5, rev: 0.6 })
T.stages2.forEach((tt, i) => c(tt + 0.01, 'tick', { f: 2400 + i * 240, gain: 0.08, p: 0.1 }))
for (let k = 0; k < 3; k++) c(T.flap + k * 0.11, 'tick', { f: 1100 - k * 80, d: 0.04, gain: 0.16, p: -0.3 })
c(T.cert, 'whoosh', { d: 0.68, f0: 500, f1: 2600, gain: 0.16, p0: 0.4, p1: -0.5, peak: 0.75 })
c(T.seat, 'sub', { d: 0.5, f0: 130, f1: 70, gain: 0.32, click: 0.9, rev: 0.3 })
c(T.seat + 0.01, 'pluck', { f: 1318.51, d: 1.6, gain: 0.13, bright: 0.6, rev: 0.8 })
c(T.seat + 0.08, 'pluck', { f: 1975.53, d: 1.6, gain: 0.09, bright: 0.6, rev: 0.8 })

// BAR 7 — back to the place
c(T.iris - 0.05, 'reverse_swell', { d: 0.62, f: 146.83, gain: 0.22, rev: 0.5 })
c(T.iris, 'whoosh', { d: 0.62, f0: 3000, f1: 220, gain: 0.2, p0: -0.3, p1: 0.3, peak: 0.5, rev: 0.5 })
c(T.irisEnd, 'sub', { d: 1.4, f0: 66, f1: 38, gain: 0.5, click: 0.3, rev: 0.5 })
c(T.plate, 'whoosh', { d: 0.4, f0: 300, f1: 1800, gain: 0.1, peak: 0.85 })
T.pills.forEach((tt, i) => c(tt, 'tick', { f: 2000 + i * 300, gain: 0.07, p: -0.2 + i * 0.2 }))
c(T.roll1, 'tick', { f: 1500, gain: 0.16 }); c(T.roll1, 'pluck', { f: 440.0, d: 1.2, gain: 0.12, bright: 0.3, rev: 0.6 })
c(T.roll2, 'tick', { f: 1700, gain: 0.16 }); c(T.roll2, 'pluck', { f: 587.33, d: 1.4, gain: 0.13, bright: 0.3, rev: 0.6 })

// BAR 8 — the state, resolve
c(T.pullOut, 'whoosh', { d: 1.0, f0: 2600, f1: 160, gain: 0.24, p0: 0.2, p1: -0.2, peak: 0.35, rev: 0.6 })
c(T.pullOut, 'chord_pad', { freqs: [73.42, 146.83, 220.0], d: 1.7, gain: 0.08, a: 0.5, r: 0.6, cutoff: 900, rev: 0.6 })
c(T.ring, 'data_stream', { d: 1.6, rate: 24, f: [3000, 6800], gain: 0.04, p_spread: 1.0, seed: 51, rev: 0.8 })
c(T.line, 'riser', { d: T.lockup - T.line, f0: 800, f1: 4000, gain: 0.08, rev: 0.4 })
c(T.lockup, 'sub', { d: 1.25, f0: 58, f1: 34, gain: 0.85, click: 0.4, rev: 0.6 })
c(T.lockup, 'chord_pad', { freqs: [73.42, 146.83, 185.0, 220.0, 329.63, 440.0], d: 1.25, gain: 0.2, a: 0.02, r: 0.9, cutoff: 2600, rev: 0.8 })
c(T.lockup, 'pluck', { f: 1174.66, d: 1.2, gain: 0.13, bright: 0.4, rev: 1.0 })
c(T.lockup + 0.06, 'pluck', { f: 1760.0, d: 1.2, gain: 0.09, bright: 0.4, rev: 1.0 })
c(T.lockup, 'boom_air', { d: 1.25, gain: 0.32, rev: 0.7 })

fs.writeFileSync(new URL('../film/cues.json', import.meta.url), JSON.stringify({ bpm: BPM, dur: DUR, reverb: 2.6, cues }, null, 1))
const beats = []
for (let b = 0; b * BEAT < DUR - 1e-6; b++) beats.push(+(b * BEAT).toFixed(4))
fs.writeFileSync(new URL('../film/beats.json', import.meta.url), JSON.stringify({ bpm: BPM, beat: BEAT, bar: BAR, beats, downbeats: beats.filter((_, i) => i % 4 === 0), events: Object.fromEntries(Object.entries(T).filter(([, v]) => typeof v === 'number')) }, null, 1))
console.log(cues.length, 'cues;', beats.length, 'beats')

// Motion primitives. Everything here is a pure function of its inputs.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const inv = (a, b, v) => clamp((v - a) / (b - a))
export const smooth = (t) => t * t * (3 - 2 * t)

// cubic-bezier solver (same curve definition as CSS)
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t) => ((ax * t + bx) * t + cx) * t
  const sy = (t) => ((ay * t + by) * t + cy) * t
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-6) break; if (Math.abs(d) < 1e-6) break; t -= e / d }
    let lo = 0, hi = 1
    for (let i = 0; i < 30 && Math.abs(sx(t) - x) > 1e-6; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2 }
    return sy(t)
  }
}

export const E = {
  linear: (t) => t,
  inOut: bezier(0.65, 0, 0.35, 1),       // camera moves
  out: bezier(0.16, 1, 0.3, 1),          // expo-ish settle
  outSoft: bezier(0.25, 0.8, 0.25, 1),
  in: bezier(0.55, 0, 1, 0.45),
  inExpo: bezier(0.7, 0, 0.84, 0),
  outExpo: bezier(0.19, 1, 0.22, 1),
  inOutExpo: bezier(0.87, 0, 0.13, 1),
  appPop: bezier(0.34, 1.56, 0.64, 1),   // the app's splash curve
  snap: bezier(0.2, 0, 0, 1),
}

// progress of t through [a,b] with easing
export const seg = (t, a, b, ease = E.linear) => ease(inv(a, b, t))

// keyframes: [[t, value, easeIntoThisKey?], ...]; values may be numbers or arrays
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i]
    const [t0, v0] = keys[i - 1]
    if (t <= t1) {
      const p = (e || E.inOut)(inv(t0, t1, t))
      return Array.isArray(v0) ? v0.map((x, k) => lerp(x, v1[k], p)) : lerp(v0, v1, p)
    }
  }
  return keys[keys.length - 1][1]
}

// critically/under-damped spring step response as a closed form of time (0→1)
export function spring(t, { freq = 2.2, damp = 0.55 } = {}) {
  if (t <= 0) return 0
  const w = 2 * Math.PI * freq
  if (damp >= 1) return 1 - Math.exp(-w * t) * (1 + w * t)
  const wd = w * Math.sqrt(1 - damp * damp)
  return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t))
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// deterministic hash noise (value noise 1D) for subtle drift
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
export function noise1(x) { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1 }

export const fmt = (n) => Math.round(n).toLocaleString('en-IN')
export const css = (el, o) => { for (const k in o) el.style[k] = o[k]; return el }
export const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }

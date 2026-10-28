// Polyline utilities: parse SVG paths, arc-length resampling, morphing, partial drawing.

export function parsePath(d) {
  // only M/L/Z absolute commands (what tools/geo_build.py emits) → array of rings
  const rings = []
  let cur = null
  const re = /([MLZ])([^MLZ]*)/g
  let m
  while ((m = re.exec(d))) {
    const [, cmd, rest] = m
    if (cmd === 'M') { cur = []; rings.push(cur) }
    if (cmd === 'Z') continue
    const nums = rest.trim().split(/[ ,]+/).filter(Boolean).map(Number)
    for (let i = 0; i + 1 < nums.length; i += 2) cur.push([nums[i], nums[i + 1]])
  }
  return rings
}

export function length(pts) {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return L
}

// cumulative arc lengths
export function cumul(pts) {
  const c = [0]
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return c
}

// resample to n points evenly spaced along arc length
export function resample(pts, n) {
  const c = cumul(pts), L = c[c.length - 1]
  const out = []
  let j = 1
  for (let i = 0; i < n; i++) {
    const s = (L * i) / (n - 1)
    while (j < c.length - 1 && c[j] < s) j++
    const seg = c[j] - c[j - 1] || 1
    const u = Math.min(1, Math.max(0, (s - c[j - 1]) / seg))
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u])
  }
  return out
}

// point at arc-length fraction u ∈ [0,1]
export function at(pts, u, c = cumul(pts)) {
  const L = c[c.length - 1], s = Math.min(L, Math.max(0, u * L))
  let lo = 0, hi = c.length - 1
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid] < s) lo = mid; else hi = mid }
  const seg = c[hi] - c[lo] || 1, k = (s - c[lo]) / seg
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k]
}

// sub-polyline between fractions u0..u1
export function slice(pts, u0, u1, c = cumul(pts)) {
  if (u1 <= u0) return []
  const L = c[c.length - 1], s0 = u0 * L, s1 = u1 * L
  const out = [at(pts, u0, c)]
  for (let i = 1; i < pts.length - 1; i++) if (c[i] > s0 && c[i] < s1) out.push(pts[i])
  out.push(at(pts, u1, c))
  return out
}

export const mix = (A, B, t) => A.map((p, i) => [p[0] + (B[i][0] - p[0]) * t, p[1] + (B[i][1] - p[1]) * t])

// draw polyline onto ctx (already transformed)
export function strokePts(ctx, pts) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.stroke()
}

// rotate a closed ring so it starts at the vertex nearest to p
export function startNear(ring, p) {
  let best = 0, bd = Infinity
  ring.forEach((q, i) => { const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (d < bd) { bd = d; best = i } })
  return ring.slice(best).concat(ring.slice(0, best + 1))
}

// smooth a polyline with Chaikin corner cutting
export function chaikin(pts, iter = 2) {
  let p = pts
  for (let k = 0; k < iter; k++) {
    const o = [p[0]]
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1]
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    o.push(p[p.length - 1]); p = o
  }
  return p
}

// cubic bezier sampled to n points
export function cubic(p0, p1, p2, p3, n = 64) {
  const out = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), u = 1 - t
    out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]])
  }
  return out
}

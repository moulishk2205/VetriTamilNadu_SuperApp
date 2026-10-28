// node tools/probe.mjs  → seek sweep (every 0.05 s, errors reported), write-on timings, and out/review/scr_frames.txt
// built from the RENDERED evolution: every frame's visible string, partial states and the word's on-screen ink width.
import { chromium } from 'playwright'
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const ROOT = '/Users/chandyfolder/vetri-app/motion-studio'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res) })
await new Promise((r) => server.listen(0, r))
const b = await chromium.launch({ args: ['--font-render-hinting=none'] }); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } })
const errs = []; pg.on('pageerror', (e) => errs.push(e.message))
await pg.goto(`http://localhost:${server.address().port}/film2/index.html`)
await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
const { T, SCR, DUR } = await pg.evaluate(async () => { const m = await import('./timeline.js'); return { T: m.T, SCR: { frames: m.SCR.frames }, DUR: m.DUR } })
console.log('WR', JSON.stringify(await pg.evaluate(() => window.__WR)))
// 1 · seek sweep
const bad = await pg.evaluate((dur) => { const out = []; for (let t = 0; t < dur; t += 0.05) { try { window.seek(t) } catch (e) { out.push(t.toFixed(2) + ' ' + e.message) } } return out }, DUR)
console.log('sweep errors:', bad.length, bad.slice(0, 5), 'pageerrors:', errs.length, errs.slice(0, 3))
// 2 · the evolution as rendered, frame by frame
const rows = await pg.evaluate(({ a, z }) => {
  const out = [], svg = document.querySelector('.slots').closest('svg'), slots = [...svg.querySelectorAll('.slots text')], fin = svg.querySelector('.fin'), wg = svg.querySelector('.wg')
  for (let f = Math.round(a * 30); f <= Math.round(z * 30); f++) {
    const t = f / 30; window.seek(t)
    const vis = slots.map((s) => ({ g: s.textContent, a: +s.getAttribute('opacity') })).filter((q) => q.g && q.a > 0)
    const str = vis.map((q) => q.g).join(''), partial = vis.some((q) => q.a < 0.999)
    const rs = +fin.getAttribute('opacity') >= 1 ? [fin.querySelector('.main').getBoundingClientRect()] : slots.filter((s) => s.textContent && +s.getAttribute('opacity') > 0).map((s) => s.getBoundingClientRect())
    const L = Math.min(...rs.map((r) => r.left)), Rr = Math.max(...rs.map((r) => r.right)), bb = { left: L, width: Rr - L }
    out.push({ f, t: +t.toFixed(3), s: str + (partial ? '  (a new letter half-in on its tick)' : ''), w: Math.round(bb.width), x0: Math.round(bb.left) })
  }
  return out
}, { a: T.scram - 0.1, z: T.scramEnd + 0.1 })
const lines = ['# மாற்றம் → முன்னேற்றம் — every frame as RENDERED (30 fps). Ink-box width of the word in px at 1080p, and its left edge.', '# frame  time    width  left   string', ...rows.map((r) => `${String(r.f).padStart(5)}  ${r.t.toFixed(3)}  ${String(r.w).padStart(5)}  ${String(r.x0).padStart(4)}   ${r.s}`)]
const distinct = [...new Set(rows.map((r) => r.s.replace(/  \(.*\)$/, '')))]
lines.push('', '# distinct strings (for the native reader):', ...distinct)
fs.writeFileSync(path.join(ROOT, 'out/review/scr_frames.txt'), lines.join('\n') + '\n')
console.log(lines.slice(2).join('\n'))
await b.close(); server.close()

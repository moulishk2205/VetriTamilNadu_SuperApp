// Frame renderer: every frame is window.seek(t) on a fresh deterministic paint.
//
//   node render.mjs                      full render → out/vetri_film.mp4
//   node render.mjs --sheet              one frame per beat → out/sheet_*.png (contact sheet)
//   node render.mjs --at 3.2,7.5         single stills → out/still_<t>.png
//   node render.mjs --from 4 --to 9      partial range (preview)
//   flags: --fps 30 --sub 2 (motion-blur subframes) --scale 1 (1=1080p, 2=4K) --workers 6 --draft
import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'

const ROOT = path.dirname(new URL(import.meta.url).pathname)
const args = process.argv.slice(2)
const flag = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) }

const FILM = String(flag('film', 'film'))
const DUR = Number(flag('dur', FILM === 'film2' ? 102.0 : 20))
const FPS = Number(flag('fps', 30))
const SUB = Number(flag('sub', 2))              // subframes per output frame (shutter blend)
const SCALE = Number(flag('scale', 1))
const WORKERS = Number(flag('workers', 7))
const W = 1920, H = 1080
const OUT = path.join(ROOT, 'out')
fs.mkdirSync(OUT, { recursive: true })

// ── static server ────────────────────────────────────────────────────────────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wav': 'audio/wav' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const URL_ = `http://localhost:${server.address().port}/${FILM}/index.html${flag('draft', false) ? '?draft=1' : ''}`

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb', '--disable-gpu-vsync'] })

const SPLIT = !!flag('split', false)   // one browser process per worker (parallel compositing at 4K)
const extraBrowsers = []
async function openPage() {
  const b = SPLIT ? await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb', '--disable-gpu-vsync'] }) : browser
  if (SPLIT) extraBrowsers.push(b)
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.error('pageerror', e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.text()) })
  await page.goto(URL_, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  return page
}

async function still(page, t, file) {
  await page.evaluate((tt) => window.seek(tt), t)
  await page.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', quality: file.endsWith('.jpg') ? 92 : undefined })
}

// ── modes ────────────────────────────────────────────────────────────────────
if (flag('at', false)) {
  const page = await openPage()
  for (const t of String(flag('at')).split(',').map(Number)) {
    const f = path.join(OUT, `still_${t.toFixed(2)}.png`)
    await still(page, t, f); console.log(f)
  }
  await browser.close(); server.close(); process.exit(0)
}

if (flag('sheet', false)) {
  const beats = JSON.parse(fs.readFileSync(path.join(ROOT, FILM, 'beats.json'), 'utf8'))
  const times = flag('every', false) ? Array.from({ length: Math.floor(DUR / Number(flag('every'))) }, (_, i) => i * Number(flag('every')) + 0.001) : beats.beats.map((b) => b + 0.001)
  const dir = path.join(OUT, 'sheet'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const pages = await Promise.all(Array.from({ length: Math.min(WORKERS, 6) }, openPage))
  await Promise.all(pages.map(async (pg, w) => {
    for (let i = w; i < times.length; i += pages.length) await still(pg, times[i], path.join(dir, `f_${String(i).padStart(3, '0')}.jpg`))
  }))
  const { grid } = await import('./tools/grid.mjs')
  const per = 16
  for (let k = 0; k * per < times.length; k++) {
    const idx = times.slice(k * per, (k + 1) * per).map((_, j) => k * per + j)
    const sheet = path.join(OUT, `sheet_${k}.jpg`)
    await grid(sheet, 4, idx.map((i) => path.join(dir, `f_${String(i).padStart(3, '0')}.jpg`)), idx.map((i) => times[i].toFixed(2) + 's'), browser)
    console.log(sheet)
  }
  await browser.close(); server.close(); process.exit(0)
}

// ── streaming render (no frames on disk): subframes → ordered pipe → ffmpeg tmix (shutter) → x264 ──
//   node render.mjs --film film2 --stream --sub 8 --scale 2 --workers 6 --name vetri_film_60
if (flag('stream', false)) {
  const from = Number(flag('from', 0)), to = Number(flag('to', DUR))
  const nOut = Math.round((to - from) * FPS), total = nOut * SUB
  const tOf = (g) => { const i = Math.floor(g / SUB), s = g % SUB; return from + (i + (s / SUB) * 0.5) / FPS } // 180° shutter
  const name = flag('name', FILM === 'film2' ? 'vetri_film_60' : 'vetri_film')
  const silent = path.join(OUT, `${name}_video.mp4`)
  const weights = Array.from({ length: SUB }, () => '1').join(' ')
  const vf = SUB === 1 ? `[0:v]scale=${W * SCALE}:${H * SCALE}:flags=lanczos,format=rgb24,noise=alls=2:allf=t,format=yuv420p[v]`
    : `[0:v]format=rgb24,tmix=frames=${SUB}:weights='${weights}',select='eq(mod(n,${SUB}),${SUB - 1})',setpts=N/(${FPS}*TB),scale=${W * SCALE}:${H * SCALE}:flags=lanczos,format=rgb24,noise=alls=2:allf=t,format=yuv420p[v]`   // a zero-mean temporal dither after the shutter blend: no contour rings in 8-bit
  const JPEG = !!flag('jpeg', false)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', JPEG ? 'mjpeg' : 'png', '-framerate', String(FPS * SUB), '-i', '-', '-filter_complex', vf, '-map', '[v]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', String(flag('crf', 16)), '-maxrate', String(flag('maxrate', '60M')), '-bufsize', String(flag('bufsize', '120M')), '-pix_fmt', 'yuv420p', '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] })   // --crf / --maxrate tune quality vs size (master: --crf 10 --maxrate 120M → ≤ ~1.5 GB for 101 s)
  const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))))
  const pending = new Map(); let next = 0, lastLog = -1, lastMove = Date.now()
  const waiters = []   // every worker that is too far ahead waits here; ALL are woken whenever the write head advances (one shared slot would strand the others: deadlock)
  const advanced = () => new Promise((r) => waiters.push(r))
  async function put(g, buf) {
    pending.set(g, buf)
    while (pending.has(next)) {
      const b = pending.get(next); pending.delete(next); next++; lastMove = Date.now()
      while (waiters.length) waiters.shift()()
      if (next % (SUB * 30) === 0 && next !== lastLog) { lastLog = next; const el = (Date.now() - t0) / 1000, done = next / SUB; console.log(`${done}/${nOut} frames  ${el.toFixed(0)}s  eta ${((nOut - done) * el / done / 60).toFixed(0)} min`) }
      if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r))
    }
    while (waiters.length) waiters.shift()()
  }
  const t0 = Date.now()
  const watchdog = setInterval(() => { if (Date.now() - lastMove > 240000) { console.error(`STALL: no frame written for 4 min at subframe ${next}/${total} — aborting`); process.exit(3) } }, 15000)   // never hang silently
  const pages = await Promise.all(Array.from({ length: WORKERS }, openPage))
  const AHEAD = WORKERS * SUB * 3
  await Promise.all(pages.map(async (pg, w) => {
    for (let g = w; g < total; g += pages.length) {
      while (g - next > AHEAD) await advanced()
      await pg.evaluate((tt) => window.seek(tt), tOf(g))
      await put(g, await pg.screenshot(JPEG ? { type: 'jpeg', quality: 97 } : { type: 'png' }))
    }
  }))
  clearInterval(watchdog); ff.stdin.end(); await ffDone
  for (const b of extraBrowsers) await b.close()
  await browser.close(); server.close()
  console.log('video done in', ((Date.now() - t0) / 1000).toFixed(0), 's')
  const audio = path.join(ROOT, 'audio', FILM === 'film2' ? 'score2.wav' : 'score.wav')
  const final = path.join(OUT, `${name}.mp4`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-ss', from.toFixed(3), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', final], { stdio: 'inherit' })
  console.log(final); process.exit(0)
}

// ── full / range render ──────────────────────────────────────────────────────
const from = Number(flag('from', 0)), to = Number(flag('to', DUR))
const nOut = Math.round((to - from) * FPS)
const frames = []
for (let i = 0; i < nOut; i++) for (let s = 0; s < SUB; s++) frames.push({ i, s, t: from + (i + (s / SUB) * 0.5) / FPS }) // 180° shutter
const FR = path.join(ROOT, 'frames_' + FILM); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true })
const t0 = Date.now()
const pages = await Promise.all(Array.from({ length: WORKERS }, openPage))
let done = 0
await Promise.all(pages.map(async (pg, w) => {
  for (let k = w; k < frames.length; k += pages.length) {
    const f = frames[k]
    await still(pg, f.t, path.join(FR, `s${f.s}_${String(f.i).padStart(5, '0')}.png`))
    if (++done % 60 === 0) console.log(`${done}/${frames.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
}))
await browser.close(); server.close()
console.log('frames done in', ((Date.now() - t0) / 1000).toFixed(0), 's')

// blend subframes (shutter) and encode
const name = flag('name', from === 0 && to === DUR ? (FILM === 'film2' ? 'vetri_film_60' : 'vetri_film') : `range_${from}_${to}`)
const silent = path.join(OUT, `${name}_video.mp4`)
const ins = Array.from({ length: SUB }, (_, s) => ['-framerate', String(FPS), '-i', path.join(FR, `s${s}_%05d.png`)]).flat()
const pads = Array.from({ length: SUB }, (_, s) => `[${s}:v]`).join('')
const head = SUB === 1 ? '[0:v]' : SUB === 2 ? `${pads}blend=all_mode=average[b];[b]` : `${pads}mix=inputs=${SUB}[b];[b]`
const vf = `${head}scale=${W * SCALE}:${H * SCALE}:flags=lanczos,format=rgb24,noise=alls=2:allf=t,format=yuv420p[v]`
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', vf, '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', silent], { stdio: 'inherit' })
const audio = path.join(ROOT, 'audio', FILM === 'film2' ? 'score2.wav' : 'score.wav')
if (fs.existsSync(audio)) {
  const final = path.join(OUT, `${name}.mp4`)
  const off = from.toFixed(3)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-ss', off, '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', final], { stdio: 'inherit' })
  console.log(final)
} else console.log(silent)

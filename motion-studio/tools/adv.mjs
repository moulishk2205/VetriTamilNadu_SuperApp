// node tools/adv.mjs 'மூ,மீ,…' → advance widths at 236 px Noto Sans Tamil 700 (the film's SVG text system)
import { chromium } from 'playwright'
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const ROOT = '/Users/chandyfolder/vetri-app/motion-studio'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res) })
await new Promise((r) => server.listen(0, r))
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } })
await pg.goto(`http://localhost:${server.address().port}/film2/index.html`)
await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
const out = await pg.evaluate(async (list) => {
  await document.fonts.load('700 236px "Noto Sans Tamil"', list.join(''))
  const t = document.querySelector('.slots text'), keep = t.textContent, m = {}
  for (const g of list) { t.textContent = g; m[g] = Math.round(t.getComputedTextLength()) }
  t.textContent = keep; return m
}, process.argv[2].split(','))
console.log(JSON.stringify(out)); await b.close(); server.close()

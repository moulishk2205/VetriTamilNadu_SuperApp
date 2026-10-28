import { chromium } from 'playwright'
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const ROOT = '/Users/chandyfolder/vetri-app/motion-studio'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p)) { console.log('404', req.url); res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res) })
await new Promise(r => server.listen(0, r))
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } })
pg.on('console', m => console.log('console', m.type(), m.text())); pg.on('pageerror', e => console.log('pageerror', e.message, e.stack))
await pg.goto(`http://localhost:${server.address().port}/${process.argv[2] || 'film'}/index.html`)
await pg.waitForTimeout(6000)
console.log('ready?', await pg.evaluate(() => window.__ready))
await b.close(); server.close()

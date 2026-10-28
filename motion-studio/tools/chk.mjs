// node tools/chk.mjs out/review/chk  → grid sheets of out/still_*.png (labelled by time)
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { grid } from './grid.mjs'
const prefix = process.argv[2] || 'out/review/chk'
const files = fs.readdirSync('out').filter((f) => /^still_.*\.png$/.test(f)).sort((a, b) => parseFloat(a.slice(6)) - parseFloat(b.slice(6))).map((f) => path.join('out', f))
const browser = await chromium.launch()
for (let k = 0; k * 16 < files.length; k++) {
  const fs_ = files.slice(k * 16, (k + 1) * 16)
  const out = `${prefix}_${k}.jpg`
  await grid(out, 4, fs_, fs_.map((f) => path.basename(f).slice(6, -4) + 's'), browser); console.log(out)
}
await browser.close()

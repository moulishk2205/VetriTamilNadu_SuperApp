// Contact sheets from a rendered video: node tools/sheets.mjs out/v2_draft1.mp4 0.5 out/review/r1
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { grid } from './grid.mjs'

const [video, stepS = '0.5', prefix = 'out/review/sheet'] = process.argv.slice(2)
const step = Number(stepS)
const dir = prefix + '_frames'
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString())
const times = []
for (let t = step / 2; t < dur; t += step) times.push(+t.toFixed(3))
execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-vf', `fps=1/${step},scale=960:540`, '-q:v', '3', path.join(dir, 'f_%04d.jpg')])
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort().map((f) => path.join(dir, f))
const browser = await chromium.launch()
const per = 16, out = []
for (let k = 0; k * per < files.length; k++) {
  const fs_ = files.slice(k * per, (k + 1) * per)
  const labels = fs_.map((_, j) => `${times[k * per + j]?.toFixed(2)}s`)
  const f = `${prefix}_${String(k).padStart(2, '0')}.jpg`
  await grid(f, 4, fs_, labels, browser); out.push(f)
}
await browser.close()
console.log(out.join('\n'))

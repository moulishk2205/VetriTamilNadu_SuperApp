// Tile stills into a labelled grid (ffmpeg here has no drawtext, so compose in Chromium).
// node tools/grid.mjs out/grid.jpg <cols> file1.png file2.png ...
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

export async function grid(outFile, cols, files, labels, browser) {
  const w = cols >= 4 ? 480 : cols === 3 ? 640 : 960, h = Math.round(w * 9 / 16)
  const rows = Math.ceil(files.length / cols)
  const own = !browser
  browser = browser || await chromium.launch()
  const page = await browser.newPage({ viewport: { width: w * cols, height: h * rows } })
  const html = `<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(${cols},${w}px)">${files.map((f, i) => `<div style="position:relative;width:${w}px;height:${h}px"><img src="data:image/${f.endsWith('jpg') ? 'jpeg' : 'png'};base64,${fs.readFileSync(f).toString('base64')}" style="width:100%;height:100%;display:block"><span style="position:absolute;left:8px;top:8px;background:rgba(0,0,0,.65);color:#fff;font:600 ${Math.round(w / 34)}px system-ui;padding:3px 8px;border-radius:4px">${labels ? labels[i] : path.basename(f)}</span></div>`).join('')}</body>`
  await page.setContent(html)
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 85 })
  await page.close()
  if (own) await browser.close()
  return outFile
}

if (process.argv[1] && process.argv[1].endsWith('grid.mjs')) {
  const [outFile, colsS, ...files] = process.argv.slice(2)
  await grid(outFile, Number(colsS) || 2, files, files.map((f) => path.basename(f).replace('still_', '').replace('.png', '') + 's'))
  console.log(outFile)
}

// Walk every route of the real Vetri app (offline MSW backend) and screenshot it.
// usage: node tools/capture.mjs [desktop|mobile] [persona...]
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:5179'
const mode = process.argv[2] || 'desktop'
const only = process.argv.slice(3)
const OUT = path.resolve('captures/raw', mode)
fs.mkdirSync(OUT, { recursive: true })

const ROUTES = {
  citizen: ['/home', '/services', '/wallet', '/complaint', '/ai', '/schemes', '/emergency', '/mla', '/district', '/tracker', '/profile', '/notifications', '/help', '/timeline'],
  officer: ['/officer'],
  department: ['/department'],
  mla: ['/mla-portal'],
  admin: ['/admin'],
}
const LABEL = { citizen: 'Citizen', officer: 'Officer', department: 'Department', mla: 'MLA', admin: 'Super Admin' }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function go(page, p) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, p)
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1600)
}

async function shot(page, name) {
  const file = path.join(OUT, name.replace(/[/:]/g, '_').replace(/^_/, '') + '.png')
  await page.screenshot({ path: file })
  await page.screenshot({ path: file.replace('.png', '.full.png'), fullPage: true }).catch(() => {})
  console.log('  ✓', path.basename(file))
}

async function boot(browser) {
  const ctx = await browser.newContext(
    mode === 'desktop'
      ? { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 }
      : { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  )
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  ! pageerror', e.message))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  return { ctx, page }
}

async function enter(page) {
  await page.getByText(mode === 'desktop' ? 'Government Web Portal' : 'Mobile Super App').first().click()
  await sleep(4200) // splash plays 3.2s
}

const browser = await chromium.launch()

// Pre-auth screens + selector + splash frames
if (!only.length || only.includes('pre')) {
  const { ctx, page } = await boot(browser)
  await shot(page, '00_selector')
  await page.getByText(mode === 'desktop' ? 'Government Web Portal' : 'Mobile Super App').first().click()
  for (const ms of [500, 1300, 2300]) {
    await sleep(ms === 500 ? 500 : ms === 1300 ? 800 : 1000)
    await shot(page, `01_splash_${ms}`)
  }
  await sleep(1500)
  await shot(page, '02_after_splash')
  await go(page, '/login')
  await shot(page, '03_login')
  await go(page, '/demo')
  await shot(page, '04_demo')
  await ctx.close()
}

for (const persona of Object.keys(ROUTES)) {
  if (only.length && !only.includes(persona)) continue
  console.log('persona', persona)
  const { ctx, page } = await boot(browser)
  await enter(page)
  await go(page, '/demo')
  await page.getByText(LABEL[persona], { exact: true }).first().click()
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(2000)
  await shot(page, `${persona}__landing`)
  for (const r of ROUTES[persona]) {
    await go(page, r)
    await shot(page, `${persona}_${r}`)
  }
  await ctx.close()
}

await browser.close()

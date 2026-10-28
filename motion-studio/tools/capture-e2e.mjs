// One continuous, real session: AI life event → digital service → submit →
// officer approve & issue → certificate in the citizen's locker → tracker/timeline.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:5179'
const OUT = path.resolve('captures/raw/e2e')
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
fs.writeFileSync(path.join(OUT, '_photo.png'), PNG)
fs.writeFileSync(path.join(OUT, '_doc.pdf'), Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'))

async function go(page, p) {
  await page.evaluate((to) => { window.history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')) }, p)
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1500)
}
let n = 0
async function shot(page, name) {
  const base = path.join(OUT, `${String(n++).padStart(2, '0')}_${name}`)
  await page.screenshot({ path: base + '.png' })
  await page.screenshot({ path: base + '.full.png', fullPage: true })
  console.log('  ✓', name)
}
async function as(page, role) {
  await go(page, '/demo')
  await page.getByText(role, { exact: true }).first().click()
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1800)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('  ! pageerror', e.message))
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByText('Government Web Portal').first().click()
await sleep(4200)
await as(page, 'Citizen')
await shot(page, 'home')

// 1. Ask Vetri — life event
await go(page, '/ai')
const box = page.getByPlaceholder(/Ask about a service/)
await box.fill('I bought land'); await box.press('Enter'); await sleep(3500)
await shot(page, 'ai_land')
await page.locator('main').getByRole('button', { name: /Encumbrance Certificate/ }).first().click()
await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1600)

// 2. Service flow (whatever service the card opened)
const FILL = [[/^Full Name/, 'Chandramoulishwarar K'], [/Father/, 'Krishnamoorthy S'], [/Aadhaar/, '234567890123'], [/Mobile/, '9876543210'], [/Annual Family Income/, '240000'], [/Survey/i, '112/4B'], [/Village/i, 'Mylapore'], [/Address Line/, '12/3, TTK Road, Alwarpet'], [/Taluk/, 'Mylapore'], [/Pincode/, '600018'], [/Period|Years|From/i, '1987'], [/Document No|Deed/i, '4521/2026']]
for (let i = 0; i < 10; i++) {
  await shot(page, `svc_step${i}`)
  for (const inp of await page.$$('input[type=file]')) {
    const accept = (await inp.getAttribute('accept')) || ''
    await inp.setInputFiles(path.join(OUT, accept.includes('image') && !accept.includes('pdf') ? '_photo.png' : '_doc.pdf')).catch(() => {})
    await sleep(200)
  }
  for (const [re, val] of FILL) {
    for (const f of await page.locator('main').getByLabel(re).all()) {
      const tag = await f.evaluate((el) => el.tagName).catch(() => 'X')
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') continue
      const type = await f.getAttribute('type')
      if (type === 'date') { await f.fill('2026-09-14').catch(() => {}); continue }
      if (await f.inputValue().catch(() => '')) continue
      await f.click().catch(() => {}); await f.pressSequentially(type === 'number' ? '240000' : val, { delay: 4 }).catch(() => {})
    }
  }
  for (const f of await page.$$('main input[type=date]')) if (!(await f.inputValue())) await f.fill('2026-09-14').catch(() => {})
  for (const f of await page.$$('main input[type=number]')) if (!(await f.inputValue())) await f.fill('1987').catch(() => {})
  for (const sel of await page.$$('main select')) {
    const opts = await sel.$$eval('option', (os) => os.map((o) => o.value).filter(Boolean))
    if (!(await sel.inputValue()) && opts.length) await sel.selectOption(opts[0]).catch(() => {})
  }
  for (const f of await page.$$('main input[type=text]:not([readonly])')) if (!(await f.inputValue())) await f.fill('Mylapore').catch(() => {})
  await sleep(400)
  if (await page.getByText(/Track application/).count()) break
  const next = page.locator('main').getByRole('button', { name: /^(Continue|I meet these — continue|Review application|Submit application)/i }).last()
  if (!(await next.count()) || (await next.isDisabled().catch(() => true))) { await shot(page, `svc_blocked${i}`); break }
  await next.click(); await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1600)
}
await shot(page, 'svc_submitted')
const ref = (await page.locator('main').innerText()).match(/APP-2026-[A-Z]+-\d+/)?.[0]
console.log('REF', ref)
await go(page, '/tracker'); await shot(page, 'tracker_submitted')

// 3. Officer approves the same application
await as(page, 'Officer')
await shot(page, 'officer_queue')
if (ref) {
  await go(page, '/officer/app/' + ref)
  await shot(page, 'officer_review')
  await page.getByText('Approve & Issue').first().click(); await sleep(500)
  await shot(page, 'officer_confirm')
  await page.getByRole('button', { name: 'Confirm' }).click(); await sleep(3000)
  await shot(page, 'officer_issued')
}

// 4. Back to the citizen
await as(page, 'Citizen')
for (const r of ['/wallet', '/tracker', '/notifications', '/timeline', '/mla', '/district', '/home']) { await go(page, r); await shot(page, 'after' + r.replace('/', '_')) }
await as(page, 'MLA'); await shot(page, 'mla_portal_after')
for (const tab of ['Trends', 'Services', 'People', 'Wards']) {
  await page.getByRole('button', { name: tab, exact: true }).first().click().catch(() => {}); await sleep(900); await shot(page, 'mla_' + tab.toLowerCase())
}
await as(page, 'Super Admin'); await shot(page, 'admin_after')
for (const tab of ['Audit']) { await page.getByRole('button', { name: tab, exact: true }).first().click().catch(() => {}); await sleep(900); await shot(page, 'admin_' + tab.toLowerCase()) }
await browser.close()

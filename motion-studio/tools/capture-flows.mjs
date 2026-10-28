// Drive the real app through its key journeys and screenshot each state.
// usage: node tools/capture-flows.mjs [ai|service|officer|all]
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:5179'
const which = process.argv[2] || 'all'
const OUT = path.resolve('captures/raw/flows')
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// tiny valid PNG + PDF for upload slots
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')
fs.writeFileSync(path.join(OUT, '_photo.png'), PNG)
fs.writeFileSync(path.join(OUT, '_doc.pdf'), PDF)

async function go(page, p) {
  await page.evaluate((to) => { window.history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')) }, p)
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1500)
}
async function shot(page, name, full = true) {
  const file = path.join(OUT, name + '.png')
  await page.screenshot({ path: file, fullPage: full })
  console.log('  ✓', name)
}
async function session(browser, role) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  ! pageerror', e.message))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByText('Government Web Portal').first().click()
  await sleep(4200)
  await go(page, '/demo')
  await page.getByText(role, { exact: true }).first().click()
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1800)
  return { ctx, page }
}

const browser = await chromium.launch()

if (which === 'ai' || which === 'all') {
  const { ctx, page } = await session(browser, 'Citizen')
  await go(page, '/ai')
  const prompts = [
    ['ai_land', 'I bought land'],
    ['ai_marriage_house', 'I moved to Chennai after marriage and bought a house'],
    ['ai_father', 'My father passed away'],
    ['ai_income', 'I need an income certificate'],
  ]
  for (const [name, q] of prompts) {
    const box = page.getByPlaceholder(/Ask about a service/)
    await box.fill(q)
    await box.press('Enter')
    await sleep(3500)
    await shot(page, name)
    await shot(page, name + '_view', false)
  }
  await ctx.close()
}

if (which === 'service' || which === 'all') {
  const { ctx, page } = await session(browser, 'Citizen')
  const svc = process.env.SVC || 'svc_income'
  await go(page, '/service/' + svc)
  for (let i = 0; i < 9; i++) {
    await shot(page, `svc_${svc}_step${i}`)
    // attach every document slot we can see
    const inputs = await page.$$('input[type=file]')
    for (const inp of inputs) {
      const accept = (await inp.getAttribute('accept')) || ''
      await inp.setInputFiles(path.join(OUT, accept.includes('image') && !accept.includes('pdf') ? '_photo.png' : '_doc.pdf')).catch(() => {})
      await sleep(250)
    }
    if (inputs.length) {
      await sleep(600)
      await shot(page, `svc_${svc}_step${i}_attached`)
      const w = page.locator('main').getByRole('button', { name: /Use a wallet document/ }).first()
      if (await w.count()) { await w.click().catch(() => {}); await sleep(500); await shot(page, `svc_${svc}_wallet_picker`); await w.click().catch(() => {}) }
    }
    // fill the form by label (step 3)
    const FILL = [[/^Full Name/, 'Chandramoulishwarar K'], [/Father/, 'Krishnamoorthy S'], [/Aadhaar/, '234567890123'], [/Mobile/, '9876543210'], [/Annual Family Income/, '240000'], [/Address Line/, '12/3, TTK Road, Alwarpet'], [/Taluk/, 'Mylapore'], [/Pincode/, '600018']]
    for (const [re, val] of FILL) {
      const f = page.locator('main').getByLabel(re).first()
      if (!(await f.count())) continue
      const tag = await f.evaluate((el) => el.tagName)
      if (tag === 'SELECT') continue
      await f.click().catch(() => {}); await f.fill('').catch(() => {}); await f.pressSequentially(val, { delay: 5 }).catch(() => {})
    }
    for (const sel of await page.$$('main select')) {
      const opts = await sel.$$eval('option', (os) => os.map((o) => o.value).filter(Boolean))
      const cur = await sel.inputValue()
      if (!cur && opts.length) await sel.selectOption(opts[0]).catch(() => {})
    }
    for (const cb of await page.$$('main input[type=checkbox]')) { if (!(await cb.isChecked())) await cb.check().catch(() => {}) }
    await sleep(500)
    const next = page.locator('main').getByRole('button', { name: /^(Continue|I meet these — continue|Review application|Submit application|Pay.*|Proceed.*)/i }).last()
    if (!(await next.count())) break
    if (await next.isDisabled().catch(() => true)) { await shot(page, `svc_${svc}_blocked${i}`); break }
    await next.click()
    await page.waitForLoadState('networkidle').catch(() => {})
    await sleep(1600)
    if (await page.getByText(/Track application/).count()) { await shot(page, `svc_${svc}_submitted`); break }
  }
  await ctx.close()
}

if (which === 'officer' || which === 'all') {
  const { ctx, page } = await session(browser, 'Officer')
  await go(page, '/officer/app/APP-2026-IC-44821')
  await shot(page, 'officer_review')
  await page.getByText('Approve & Issue').first().click()
  await sleep(500)
  await shot(page, 'officer_confirm')
  await page.getByRole('button', { name: 'Confirm' }).click()
  await sleep(3000)
  await shot(page, 'officer_issued')
  await ctx.close()
}

await browser.close()

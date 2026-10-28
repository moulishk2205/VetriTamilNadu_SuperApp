// v2 captures — one real session: catalogue, DL (address change), ration (new family card,
// wallet DL as residence proof), birth certificate (digital) → officer approves → locker,
// schemes discovery + detail, notifications, applications register, MLA counts.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:5179'
const OUT = path.resolve('captures/raw/v2')
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
fs.writeFileSync(path.join(OUT, '_photo.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'))
fs.writeFileSync(path.join(OUT, '_doc.pdf'), Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'))

let n = 0
async function shot(page, name, full = true) {
  const base = path.join(OUT, `${String(n++).padStart(2, '0')}_${name}`)
  await page.screenshot({ path: base + '.png' })
  if (full) await page.screenshot({ path: base + '.full.png', fullPage: true })
  console.log('  ✓', name)
}
async function go(page, p) {
  await page.evaluate((to) => { window.history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')) }, p)
  await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1500)
}
async function as(page, role) {
  await go(page, '/demo'); await page.getByText(role, { exact: true }).first().click()
  await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1800)
}

// generic stepper walker. sel: { label regex → option text }, fill: [[label regex, value]], wallet: { slot regex → wallet doc text }
async function walk(page, key, { sel = [], fill = [], wallet = [] }) {
  const refs = []
  for (let i = 0; i < 10; i++) {
    await shot(page, `${key}_step${i}`)
    // wallet picks first (so they show in captures), then uploads for anything still empty
    for (const [slot, docName] of wallet) {
      const block = page.locator('main').locator('div', { has: page.getByText(slot) }).filter({ has: page.getByRole('button', { name: /Use a wallet document/ }) }).last()
      if (await block.count()) {
        await block.getByRole('button', { name: /Use a wallet document/ }).first().click().catch(() => {})
        await sleep(500)
        await shot(page, `${key}_walletpicker`)
        await page.locator('main').getByRole('button', { name: new RegExp(docName) }).first().click().catch(() => {})
        await sleep(500)
        await shot(page, `${key}_walletpicked`)
      }
    }
    for (const inp of await page.$$('input[type=file]')) {
      const accept = (await inp.getAttribute('accept')) || ''
      await inp.setInputFiles(path.join(OUT, accept.includes('image') && !accept.includes('pdf') ? '_photo.png' : '_doc.pdf')).catch(() => {})
      await sleep(150)
    }
    for (const [re, opt] of sel) {
      const s = page.locator('main').getByLabel(re).first()
      if (await s.count() && (await s.evaluate((e) => e.tagName)) === 'SELECT') await s.selectOption({ label: opt }).catch(() => {})
    }
    for (const [re, val] of fill) {
      for (const f of await page.locator('main').getByLabel(re).all()) {
        const tag = await f.evaluate((e) => e.tagName).catch(() => 'X')
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') continue
        const type = await f.getAttribute('type')
        if (type === 'radio' || type === 'checkbox') continue
        if (type === 'date') { await f.fill(val).catch(() => {}); continue }
        if (await f.inputValue().catch(() => '')) continue
        await f.click().catch(() => {}); await f.pressSequentially(val, { delay: 3 }).catch(() => {})
      }
    }
    for (const g of await page.locator('main [role=radiogroup]').all()) { if (!(await g.locator('[role=radio][aria-checked=true]').count())) { const pick = g.getByRole('radio', { name: /Female/ }); await ((await pick.count()) ? pick.first() : g.getByRole('radio').first()).click().catch(() => {}) } }
    for (const r of await page.$$('main input[type=radio]')) { const name = await r.getAttribute('name'); const any = await page.$(`main input[type=radio][name="${name}"]:checked`); if (!any) await r.check().catch(() => {}) }
    for (const s of await page.$$('main select')) { const opts = await s.$$eval('option', (os) => os.map((o) => o.value).filter(Boolean)); if (!(await s.inputValue()) && opts.length) await s.selectOption(opts[0]).catch(() => {}) }
    for (const f of await page.$$('main input[type=date]')) if (!(await f.inputValue())) await f.fill('2026-09-20').catch(() => {})
    for (const f of await page.$$('main input[type=number]')) if (!(await f.inputValue())) await f.fill('3').catch(() => {})
    for (const f of await page.$$('main input[type=text]:not([readonly])')) if (!(await f.inputValue())) await f.fill('Chennai').catch(() => {})
    await sleep(350)
    if (await page.getByText(/Track application/).count()) break
    const next = page.locator('main').getByRole('button', { name: /^(Continue|I meet these — continue|Review application|Submit application)/i }).last()
    if (!(await next.count()) || (await next.isDisabled().catch(() => true))) { await shot(page, `${key}_blocked${i}`); break }
    await next.click(); await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1500)
  }
  await shot(page, `${key}_submitted`)
  const ref = (await page.locator('main').innerText()).match(/APP-2026-[A-Z]+-\d+/)?.[0]
  console.log('REF', key, ref)
  return ref
}

const COMMON = [[/^Full Name/, 'Chandramoulishwarar K'], [/Father/, 'Krishnamoorthy S'], [/Mother/, 'Priya C'], [/Aadhaar/, '234567890123'], [/Mobile/, '9876543210'], [/Head of Family/, 'Chandramoulishwarar K'], [/Address Line/, '12/3, TTK Road, Alwarpet'], [/Taluk/, 'Mylapore'], [/Pincode/, '600018'], [/RCH|PICME/, '330426001842'], [/Hospital/, 'Government RSRM Hospital, Chennai'], [/Child Name/, 'Baby of Priya'], [/Date of Birth/, '2026-09-24'], [/Number of Members/, '3']]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('  ! pageerror', e.message))
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByText('Government Web Portal').first().click(); await sleep(4200)
await as(page, 'Citizen')
await go(page, '/mla'); await shot(page, 'mla_before')
await go(page, '/services'); await shot(page, 'services')

await go(page, '/service/svc_dl')
const dl = await walk(page, 'dl', { sel: [[/Application Type/, 'Address Change'], [/Vehicle Class/, 'LMV (Car)'], [/Blood Group/, 'O+']], fill: COMMON, wallet: [[/Age & Address Proof/, 'Driving License']] })

await go(page, '/service/svc_ration')
const rc = await walk(page, 'ration', { sel: [[/Request Type/, 'New Family Card'], [/Card Type/, 'Rice (PHH)']], fill: COMMON, wallet: [[/Residence Proof/, 'Driving License']] })

await go(page, '/service/svc_birth')
const bc = await walk(page, 'birth', { sel: [[/Registration Type/, 'Standard (within 21 days)'], [/Place of Birth/, 'Hospital']], fill: COMMON })

await go(page, '/tracker'); await shot(page, 'tracker_after_submit')
await go(page, '/schemes'); await shot(page, 'schemes')
const sch = page.locator('main').getByText('Thai Maaman Thanga Modhiram Scheme').first()
const card = page.locator('main').locator('div', { has: sch }).filter({ has: page.getByRole('button', { name: /View & apply/ }) }).last()
await card.getByRole('button', { name: /View & apply/ }).first().click().catch(() => {}); await sleep(900)
await shot(page, 'scheme_detail')

// officer approves the birth certificate
await as(page, 'Officer'); await shot(page, 'officer_queue')
if (bc) {
  await go(page, '/officer/app/' + bc); await shot(page, 'officer_review_birth')
  await page.getByText('Approve & Issue').first().click(); await sleep(500)
  await page.getByRole('button', { name: 'Confirm' }).click(); await sleep(3000)
  await shot(page, 'officer_issued_birth')
}
await as(page, 'Citizen')
for (const r of ['/wallet', '/tracker', '/notifications', '/timeline', '/mla']) { await go(page, r); await shot(page, 'after' + r.replace('/', '_')) }
if (bc) { await go(page, '/tracker'); const row = page.locator('main').getByText(bc).first(); await row.click().catch(() => {}); await sleep(800); await shot(page, 'tracker_birth_detail') }
await go(page, '/tracker'); const ic = page.locator('main').getByText('APP-2026-IC-44821').first(); await ic.click().catch(() => {}); await sleep(800); await shot(page, 'tracker_income_detail')
await as(page, 'MLA'); await shot(page, 'mla_portal_after')
console.log('REFS', JSON.stringify({ dl, rc, bc }))
await browser.close()

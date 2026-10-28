import { getNode } from '../knowledge/serviceGraph'
import { getLifeEvent, type LifeEvent } from '../knowledge/lifeEvents'
import type { ActionCard, CitizenContext, ComposedReply, IntentFrame, ToolResult } from './types'
import type { CoverageResult, Prediction } from './toolExecutor'
import type { AppSnapshot, WalletDocSnapshot } from './types'

/**
 * Response Composer — turns the executed plan into a bilingual reply + action
 * cards. Every sentence is assembled from tool outputs and graph knowledge;
 * there are no canned per-intent paragraphs. (This is the surface a real LLM
 * will later generate from the same structured inputs.)
 */

const card = (label: string, screen: string, kind?: ActionCard['kind']): ActionCard => ({ label, screen, kind })

function serviceCard(serviceId: string): ActionCard | null {
  const node = getNode(serviceId)
  return node ? card(node.meta.name, `service/${serviceId}`, 'apply') : null
}

/** Tamil headline per intent kind — template data, interpolated with names. */
const TA: Record<string, (x?: string) => string> = {
  lifeEvent: (x) => `${x ?? ''} — தேவையான சேவைகளை வரிசைப்படுத்தியுள்ளேன்:`,
  applyService: (x) => `${x ?? 'சேவை'} — உங்கள் ஆவணங்களைச் சரிபார்த்தேன்:`,
  explainService: (x) => `${x ?? 'சேவை'} விவரங்கள்:`,
  coverageQuery: (x) => `${x ?? 'சேவை'}க்கு தேவையான ஆவணங்கள்:`,
  documentQuery: () => 'உங்கள் வாலெட் நிலை:',
  trackStatus: () => 'உங்கள் விண்ணப்பங்களின் நிலை:',
  schemeQuery: () => 'உங்களுக்கு பொருந்தும் திட்டங்கள்:',
  payment: () => 'கட்டணச் சேவைகள்:',
  timelineQuery: () => 'உங்கள் அரசு பயணம் — கடந்தது முதல் எதிர்காலம் வரை:',
  navigate: () => 'திறக்கிறேன்:',
  smalltalk: () => 'நான் உங்கள் அரசு உதவியாளர். இவை உதவலாம்:',
}

const out = <T>(results: ToolResult[], tool: string): T | undefined =>
  results.find((r) => r.step.tool === tool)?.output as T | undefined

function coverageSentence(cov: CoverageResult): string {
  const node = getNode(cov.serviceId)
  const coveredNames = cov.items.filter((i) => i.coveredBy && !i.expired).map((i) => `${i.requirement} → ${i.coveredBy!.name}`)
  const expired = cov.items.filter((i) => i.expired).map((i) => `${i.requirement} (your ${i.coveredBy!.name} ${i.coveredBy!.number} has EXPIRED)`)
  let s = `Your Wallet already covers ${cov.covered} of ${cov.requiredTotal} required documents`
  if (coveredNames.length) s += ` (${coveredNames.join('; ')})`
  s += '.'
  if (expired.length) s += ` ⚠ ${expired.join('; ')}.`
  if (cov.missing.length) s += ` Still needed: ${cov.missing.join(', ')}.`
  else s += ' Everything required is ready — you can submit immediately.'
  if (node) s += ` Fee ${node.meta.fee} · ${node.meta.processingTime} · ${node.meta.authorities.issuing}.`
  return s
}

export function compose(intent: IntentFrame, ctx: CitizenContext, results: ToolResult[]): ComposedReply {
  const planTrace = results.map((r) => r.step.rationale)
  const actions: ActionCard[] = []
  const parts: string[] = []
  let taHead = TA[intent.kind]()

  const prefix =
    intent.sentiment === 'empathetic' ? 'My deepest condolences. I will handle the paperwork so you don’t have to think about it. '
    : intent.sentiment === 'celebratory' ? 'Congratulations! ' : ''

  switch (intent.kind) {
    case 'lifeEvent': {
      const events = intent.lifeEvents.map(getLifeEvent).filter((e): e is LifeEvent => Boolean(e))
      taHead = TA.lifeEvent(events.map((e) => e.labelTamil).join(' + '))
      const seen = new Set<string>()
      let order = 1
      for (const ev of events) {
        for (const sid of ev.services) {
          if (seen.has(sid)) continue
          seen.add(sid)
          const node = getNode(sid)
          if (!node) continue
          const dep = ev.dependencies[sid]
          parts.push(`${order}. ${node.meta.name} (${node.meta.fee}, ${node.meta.processingTime})${dep ? ` — ${dep}` : ''}`)
          const c = serviceCard(sid)
          if (c && actions.length < 4) actions.push(c)
          order += 1
        }
      }
      const benefits = [...new Set(events.flatMap((e) => e.benefits))]
      if (benefits.length) parts.push(`Also check: ${benefits.join('; ')}.`)
      const cov = ctx.wallet.length ? ` Your Wallet already holds ${ctx.wallet.length} verified documents I can reuse across these.` : ''
      parts.push(`I sequenced these by dependency — start from the top.${cov}`)
      break
    }

    case 'applyService':
    case 'explainService':
    case 'coverageQuery': {
      const node = getNode(intent.services[0])
      taHead = TA[intent.kind](node?.meta.nameTamil ?? node?.meta.name)
      const dup = out<AppSnapshot[]>(results, 'applications.forService') ?? []
      if (dup.length) {
        parts.push(`You already have ${dup[0].referenceNo} in progress (${dup[0].status}) — track it instead of re-applying.`)
        actions.push(card('Track Application', 'tracker', 'track'))
      }
      const cov = out<CoverageResult>(results, 'wallet.coverage')
      if (cov && cov.requiredTotal > 0) parts.push(coverageSentence(cov))
      if (intent.kind === 'explainService' && node) {
        parts.push(`${node.meta.description}`)
        if (node.tips.length) parts.push(`Tip: ${node.tips[0]}.`)
        if (node.commonMistakes.length) parts.push(`Common mistake: ${node.commonMistakes[0]}.`)
      } else if (node?.tips.length) {
        parts.push(`Tip: ${node.tips[0]}.`)
      }
      if (!dup.length) {
        const c = serviceCard(intent.services[0])
        if (c) actions.push({ ...c, label: intent.kind === 'explainService' ? c.label : `Apply — ${c.label}` })
      }
      for (const rel of (node?.related ?? []).slice(0, 2)) {
        const c = serviceCard(rel)
        if (c && actions.length < 4) actions.push({ ...c, kind: 'view' })
      }
      break
    }

    case 'documentQuery': {
      const wallet = out<WalletDocSnapshot[]>(results, 'wallet.list') ?? []
      const live = wallet.filter((w) => !w.expired)
      const dead = wallet.filter((w) => w.expired)
      parts.push(`You hold ${wallet.length} verified documents: ${live.map((w) => `${w.name} (${w.number})`).join(', ')}.`)
      if (dead.length) parts.push(`⚠ Expired: ${dead.map((w) => `${w.name} ${w.number} (${w.validity})`).join(', ')} — renew before your next application.`)
      actions.push(card('Open Wallet', 'wallet', 'wallet'))
      if (dead.some((d) => /income/i.test(d.name))) actions.push(card('Renew Income Certificate', 'service/svc_income', 'apply'))
      break
    }

    case 'trackStatus': {
      const apps = out<AppSnapshot[]>(results, 'applications.list') ?? []
      const wanted = intent.entities.referenceNos.length
        ? apps.filter((a) => intent.entities.referenceNos.includes(a.referenceNo))
        : apps
      if (!wanted.length) parts.push('You have no applications yet — start one from Services and I will track it for you.')
      for (const a of wanted.slice(0, 3)) {
        parts.push(`${a.serviceName} ${a.referenceNo}: ${a.status}${a.slaDaysRemaining == null ? '' : a.slaDaysRemaining < 0 ? ` · overdue by ${-a.slaDaysRemaining} day(s) under the Right to Services charter (escalated)` : ` · ${a.slaDaysRemaining} day(s) left under the Right to Services charter (escalates automatically if missed)`}.`)
      }
      actions.push(card('Open Tracker', 'tracker', 'track'))
      break
    }

    case 'schemeQuery': {
      for (const s of ctx.schemes) parts.push(`${s.name} — ${s.benefit} (${s.matchScore}% match, ${s.department}).`)
      const cov = out<CoverageResult>(results, 'wallet.coverage')
      const incomeExpired = ctx.wallet.find((w) => /income/i.test(w.name) && w.expired)
      if (incomeExpired) parts.push(`⚠ Claims need a live Income Certificate — yours (${incomeExpired.number}) expired. Renew it first.`)
      else if (cov?.missing.length === 0) parts.push('Your Wallet already has the documents these claims need.')
      actions.push(card('View Schemes', 'schemes', 'view'))
      if (incomeExpired) actions.push(card('Renew Income Certificate', 'service/svc_income', 'apply'))
      break
    }

    case 'payment': {
      for (const sid of ['svc_proptax', 'svc_water', 'svc_mvtax', 'svc_echallan']) {
        const c = serviceCard(sid)
        if (c) actions.push({ ...c, kind: 'pay' })
      }
      parts.push('These payments are live: property tax (5% incentive in Apr/Oct windows), water charges, vehicle tax and e-Challans. Pick one and I will fetch the demand.')
      break
    }

    case 'timelineQuery': {
      const preds = out<Prediction[]>(results, 'timeline.predict') ?? []
      parts.push(`Your digital history is on the Timeline. Looking ahead, here is what I predict you will need: ${preds.map((p) => p.reason).join('; ')}.`)
      actions.push(card('Open Timeline', 'timeline', 'view'))
      for (const p of preds) {
        if (p.serviceId && actions.length < 4) {
          const c = serviceCard(p.serviceId)
          if (c) actions.push(c)
        }
      }
      break
    }

    case 'navigate': {
      const target = intent.entities.navTarget ?? 'home'
      actions.push(card(`Open ${target}`, target, 'view'))
      parts.push('Taking you there.')
      break
    }

    case 'smalltalk': {
      const preds = out<Prediction[]>(results, 'timeline.predict') ?? []
      parts.push('I can start any government service, check your documents, track applications, and plan life events end-to-end.')
      if (preds.length) parts.push(`Right now: ${preds[0].reason}.`)
      actions.push(card('All Services', 'services', 'view'), card('My Documents', 'wallet', 'wallet'))
      break
    }
  }

  return {
    text: taHead,
    en: prefix + parts.join(' '),
    actions: actions.slice(0, 4),
    plan: planTrace,
    intent: intent.kind + (intent.lifeEvents.length ? `:${intent.lifeEvents.join('+')}` : intent.services[0] ? `:${intent.services[0]}` : ''),
  }
}

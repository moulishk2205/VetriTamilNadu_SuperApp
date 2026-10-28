import { TN_DISTRICTS } from '@/features/services/catalog/geo'
import { matchLifeEvents, getLifeEvent } from '../knowledge/lifeEvents'
import { findServicesInText } from '../knowledge/serviceGraph'
import type { IntentFrame, IntentKind, MemorySnapshot } from './types'

/**
 * Intent Engine — deterministic NLP layer. Extracts intent kind, ALL matched
 * life events and services (multi-intent), entities, urgency, sentiment and
 * language BEFORE any generation happens. Matching is driven by the knowledge
 * indexes (life-event triggers + service keyword index), not by case logic.
 */

const APPLY = /\b(apply|need|want|get|start|renew|register|file|book|pay)\b|விண்ணப்பி|வேண்டும்|செலுத்த/i
const EXPLAIN = /\b(what is|explain|how (do|to)|difference|why|tell me about)\b|என்றால் என்ன|எப்படி/i
const TRACK = /\b(track|status|where is|pending|progress|delay(ed)?)\b|நிலை|எங்கே/i
const DOCQUERY = /\b(my documents|documents .*(have|hold)|wallet)\b|என்னிடம் உள்ள ஆவண/i
const COVERAGE = /\b(missing|what .*(need|required)|documents? (for|needed)|am i missing)\b|என்ன ஆவணங்கள் தேவை/i
const SCHEME = /\b(scheme|benefit|welfare|eligib\w+|scholarship)\b|திட்டம்|உதவித்தொகை/i
const PAYMENT = /\b(pay|bill|tax|due|fine)\b|கட்டணம்|வரி/i
const TIMELINE = /\b(timeline|history|journey|future|next .*(need|service))\b|வரலாறு/i
const NAV: [RegExp, string][] = [
  [/\b(wallet|documents page)\b/i, 'wallet'],
  [/\btimeline\b/i, 'timeline'],
  [/\b(tracker|applications page)\b/i, 'tracker'],
  [/\bnotifications?\b/i, 'notifications'],
  [/\b(services page|all services)\b/i, 'services'],
]
const URGENT = /\b(urgent|today|tomorrow|deadline|last date|expiring|expired|penalty|late)\b|அவசர/i
const REF_NO = /(APP|CMP|CRT)-\d{4}-[A-Z]{2,3}-\d+/g
const TAMIL = /[஀-௿]/

export function extractIntent(text: string, memory?: MemorySnapshot): IntentFrame {
  const lifeEvents = matchLifeEvents(text).map((e) => e.id)
  let services = findServicesInText(text)

  // Personalisation: stable-sort matched services by the citizen's usage.
  if (memory && services.length > 1) {
    services = [...services].sort(
      (a, b) => (memory.frequentServices[b] ?? 0) - (memory.frequentServices[a] ?? 0),
    )
  }

  const hasTamil = TAMIL.test(text)
  const hasEnglish = /[a-z]/i.test(text)
  const language = hasTamil && hasEnglish ? 'mixed' : hasTamil ? 'ta' : 'en'

  const referenceNos = [...new Set(text.match(REF_NO) ?? [])]
  const district = TN_DISTRICTS.find((d) => new RegExp(`\\b${d}\\b`, 'i').test(text))
  const navTarget = NAV.find(([re]) => re.test(text))?.[1]

  // Kind resolution — precedence encodes reasoning priority, not reply choice.
  let kind: IntentKind
  if (lifeEvents.length > 0) kind = 'lifeEvent'
  else if (referenceNos.length > 0 || TRACK.test(text)) kind = 'trackStatus'
  else if (COVERAGE.test(text) && services.length > 0) kind = 'coverageQuery'
  else if (DOCQUERY.test(text)) kind = 'documentQuery'
  else if (SCHEME.test(text) && services.length === 0) kind = 'schemeQuery'
  else if (TIMELINE.test(text)) kind = 'timelineQuery'
  else if (services.length > 0) kind = APPLY.test(text) ? 'applyService' : EXPLAIN.test(text) ? 'explainService' : 'applyService'
  else if (PAYMENT.test(text)) kind = 'payment'
  else if (navTarget) kind = 'navigate'
  else kind = 'smalltalk'

  const sentiment =
    lifeEvents.map(getLifeEvent).find((e) => e?.tone === 'empathetic') ? 'empathetic'
    : lifeEvents.map(getLifeEvent).find((e) => e?.tone === 'celebratory') ? 'celebratory'
    : 'neutral'

  return {
    kind,
    lifeEvents,
    services,
    entities: { referenceNos, district, navTarget },
    urgency: URGENT.test(text) ? 'high' : 'normal',
    sentiment,
    language,
  }
}

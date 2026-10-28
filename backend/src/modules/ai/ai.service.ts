import { Injectable } from '@nestjs/common'
import { Application, ApplicationStage, Document } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

const TERMINAL: ApplicationStage[] = [ApplicationStage.completed, ApplicationStage.rejected]

/**
 * Ask Vetri, server-side: a rule-based assistant (keyword intent matching,
 * not a language model). Intent → context → plan → tools → compose runs over
 * live platform state, so replies quote the citizen's real data. Replies are
 * English. An on-premise LLM can later replace the intent and compose steps
 * behind this same contract.
 */

export interface AiAction { label: string; screen: string; kind?: 'apply' | 'track' | 'wallet' | 'pay' | 'view' }
export interface AiReply { text: string; en?: string; actions?: AiAction[]; plan?: string[]; intent?: string }
export interface Suggestion { id: string; text: string; prompt: string; icon: string }

type Intent = 'greeting' | 'track' | 'wallet' | 'apply' | 'scheme' | 'complaint' | 'help' | 'fallback'

const INTENT_RULES: { intent: Intent; kws: RegExp }[] = [
  { intent: 'greeting', kws: /\b(hi|hello|hey|vanakkam|வணக்கம்|good (morning|evening))\b/i },
  { intent: 'track', kws: /\b(status|track|where is|progress|pending|application|APP-\d)/i },
  { intent: 'wallet', kws: /\b(document|certificate|wallet|download|licen[cs]e|ration|birth cert|income cert)\b/i },
  { intent: 'scheme', kws: /\b(scheme|eligib|benefit|subsidy|pension|insurance|welfare|kisan|kalaignar)\b/i },
  { intent: 'complaint', kws: /\b(complaint|road|water supply|garbage|streetlight|drainage|grievance)\b/i },
  { intent: 'apply', kws: /\b(apply|how do i get|how to get|need a|want a|new (certificate|licen[cs]e)|register)\b/i },
  { intent: 'help', kws: /\b(help|what can you|who are you|options|assist)\b/i },
]

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  private detectIntent(text: string): Intent {
    for (const r of INTENT_RULES) if (r.kws.test(text)) return r.intent
    return 'fallback'
  }

  async chat(citizenId: string | undefined, text: string): Promise<AiReply> {
    const plan: string[] = []
    const intent = this.detectIntent(text)
    plan.push(`intent: classified as "${intent}"`)

    const [citizen, applications, documents, schemes] = await Promise.all([
      citizenId ? this.prisma.citizen.findUnique({ where: { id: citizenId } }) : null,
      citizenId ? this.prisma.application.findMany({ where: { citizenId, deletedAt: null }, orderBy: { createdAt: 'desc' } }) : ([] as Application[]),
      citizenId ? this.prisma.document.findMany({ where: { citizenId, deletedAt: null } }) : ([] as Document[]),
      this.prisma.scheme.findMany({ orderBy: { matchScore: 'desc' } }),
    ])
    plan.push(`context: ${applications.length} applications, ${documents.length} documents, ${schemes.length} schemes`)

    const name = citizen?.fullName?.split(' ')[0] ?? 'there'

    switch (intent) {
      case 'greeting':
        plan.push('compose: personalised greeting + top actions')
        return {
          intent, plan,
          text: `Vanakkam ${name}! I'm Vetri, your government assistant. I can help you apply for services, track applications, find your documents, or check scheme eligibility. What do you need?`,
          actions: [
            { label: 'Browse services', screen: 'services', kind: 'apply' },
            { label: 'Track applications', screen: 'tracker', kind: 'track' },
          ],
        }

      case 'track': {
        plan.push('tool: query applications')
        const active = applications.filter((a) => !TERMINAL.includes(a.stage))
        plan.push(`compose: ${active.length} active application(s)`)
        if (applications.length === 0)
          return { intent, plan, text: `You have no applications yet, ${name}. Would you like to apply for a service?`, actions: [{ label: 'Browse services', screen: 'services', kind: 'apply' }] }
        const lines = applications.slice(0, 4).map((a) => `• ${a.serviceName} (${a.referenceNo}) — ${a.statusLabel}`)
        return {
          intent, plan,
          text: `Here's where your applications stand:\n${lines.join('\n')}\n\nTap below to see full timelines.`,
          actions: [{ label: 'Open tracker', screen: 'tracker', kind: 'track' }],
        }
      }

      case 'wallet': {
        plan.push('tool: query wallet documents')
        if (documents.length === 0)
          return { intent, plan, text: `Your wallet is empty right now, ${name}. Approved certificates land here automatically.`, actions: [{ label: 'Open wallet', screen: 'wallet', kind: 'wallet' }] }
        const match = documents.find((d) => text.toLowerCase().includes(d.name.toLowerCase().split(' ')[0]))
        plan.push(match ? `compose: matched "${match.name}"` : 'compose: list wallet')
        const body = match
          ? `Your ${match.name} (${match.number}) issued by ${match.issuer} is in your wallet — valid: ${match.validity}. You can download or share it.`
          : `You have ${documents.length} documents in your wallet: ${documents.map((d) => d.name).join(', ')}.`
        return { intent, plan, text: body, actions: [{ label: 'Open wallet', screen: 'wallet', kind: 'wallet' }] }
      }

      case 'apply': {
        plan.push('tool: match services in text')
        const services = await this.prisma.service.findMany()
        const matched = services.find((s) => {
          const words = s.name.toLowerCase().split(/\s+/)
          return words.some((w) => w.length > 3 && text.toLowerCase().includes(w))
        })
        plan.push(matched ? `compose: guide "${matched.name}"` : 'compose: prompt service selection')
        if (matched)
          return {
            intent, plan,
            text: `To apply for a ${matched.name}: it's ${matched.fee}, takes ${matched.processingTime}, and is issued by ${matched.department}. ${matched.description ?? ''} Tap below to start — I'll pre-fill what I can from your profile.`,
            actions: [{ label: `Apply: ${matched.name}`, screen: 'services', kind: 'apply' }],
          }
        return { intent, plan, text: `I can help you apply, ${name}. Which service — an income certificate, driving licence, ration card, patta, or something else? Browse the full catalogue below.`, actions: [{ label: 'Browse services', screen: 'services', kind: 'apply' }] }
      }

      case 'scheme': {
        plan.push('tool: rank eligible schemes')
        const top = schemes.slice(0, 3)
        plan.push(`compose: top ${top.length} schemes by match score`)
        const lines = top.map((s) => `• ${s.name} — ${s.benefit} (${s.matchScore}% match, ${s.department})`)
        return {
          intent, plan,
          text: `Based on your profile, these schemes look most relevant:\n${lines.join('\n')}\n\nTap below for eligibility details.`,
          actions: [{ label: 'View schemes', screen: 'schemes', kind: 'view' }],
        }
      }

      case 'complaint':
        plan.push('compose: complaint intake guidance')
        return {
          intent, plan,
          text: `I can file a civic complaint for you, ${name} — road damage, water supply, streetlights, garbage or drainage. It'll be routed to the right department with a tracking number. Start below.`,
          actions: [{ label: 'File a complaint', screen: 'complaint', kind: 'view' }],
        }

      case 'help':
        plan.push('compose: capability overview')
        return {
          intent, plan,
          text: `I'm Vetri — I can: apply for 20+ government services, track your applications end-to-end, pull certificates from your wallet, check welfare-scheme eligibility, and file civic complaints. Ask me in Tamil or English.`,
          actions: [
            { label: 'Browse services', screen: 'services', kind: 'apply' },
            { label: 'Track applications', screen: 'tracker', kind: 'track' },
          ],
        }

      default:
        plan.push('compose: clarifying fallback')
        return {
          intent, plan,
          text: `I want to make sure I help correctly, ${name}. Are you trying to apply for a service, track an application, find a document, or check a scheme? You can also just describe your situation in your own words.`,
          actions: [
            { label: 'Browse services', screen: 'services', kind: 'apply' },
            { label: 'Track applications', screen: 'tracker', kind: 'track' },
          ],
        }
    }
  }

  /** Proactive suggestions computed from the citizen's live state. */
  async suggestions(citizenId: string | undefined): Promise<{ items: Suggestion[] }> {
    const items: Suggestion[] = []
    if (citizenId) {
      const [apps, docs] = await Promise.all([
        this.prisma.application.findMany({ where: { citizenId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
        this.prisma.document.findMany({ where: { citizenId, deletedAt: null } }),
      ])
      const active = apps.find((a) => !TERMINAL.includes(a.stage))
      if (active) items.push({ id: 'sg_track', text: `Track ${active.serviceName}`, prompt: `What's the status of ${active.referenceNo}?`, icon: 'Clock' })
      const expiring = docs.find((d) => /^\d{2}\/\d{4}$/.test(d.validity))
      if (expiring) items.push({ id: 'sg_renew', text: `Renew ${expiring.name}`, prompt: `How do I renew my ${expiring.name}?`, icon: 'RefreshCw' })
    }
    const schemes = await this.prisma.scheme.findMany({ orderBy: { matchScore: 'desc' }, take: 1 })
    if (schemes[0]) items.push({ id: 'sg_scheme', text: `Check ${schemes[0].name}`, prompt: `Am I eligible for ${schemes[0].name}?`, icon: 'Sparkles' })
    items.push({ id: 'sg_apply', text: 'Apply for a service', prompt: 'What services can I apply for?', icon: 'FileText' })
    return { items: items.slice(0, 4) }
  }
}

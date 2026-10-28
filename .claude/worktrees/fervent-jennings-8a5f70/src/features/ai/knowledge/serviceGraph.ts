import { SERVICE_META } from '@/features/services/catalog/meta'
import type { ServiceMeta } from '@/features/services/catalog/types'
import { FORMS } from '@/features/services/catalog/forms'
import type { DocumentRequirement } from '@/lib/forms/types'
import { LIFE_EVENTS } from './lifeEvents'

/**
 * Government Knowledge Graph.
 *
 * Nodes are DERIVED from the single metadata source (SERVICE_META + FORMS) at
 * module init — nothing is duplicated. This file adds only what metadata cannot
 * express: keyword indexes for intent matching, cross-service edges, and
 * curated officer-grade knowledge (tips, common mistakes, rejection reasons).
 */

export interface ServiceNode {
  meta: ServiceMeta
  requirements: DocumentRequirement[]
  keywords: RegExp
  related: string[]
  tips: string[]
  commonMistakes: string[]
  rejectionReasons: string[]
}

/** Intent keywords per service (English + Tamil) — index data, not logic. */
const KEYWORDS: Record<string, RegExp> = {
  svc_income: /income cert|வருமான/i,
  svc_community: /community|caste cert|சாதி|சமூக/i,
  svc_birth: /birth cert|பிறப்பு/i,
  svc_death: /death cert|இறப்பு சான்/i,
  svc_marriage: /marriage cert|திருமண சான்/i,
  svc_dl: /driving licen|driver.?s licen|\bdl\b|learner|llr|ஓட்டுநர்/i,
  svc_ration: /ration|smart ?card|family card|ரேஷன்|குடும்ப அட்டை/i,
  svc_patta: /patta(?! ?chitta)|mutation|subdivision|பட்டா/i,
  svc_residence: /residence cert|வசிப்பிட/i,
  svc_nativity: /nativity|native of|state quota|பூர்வீக/i,
  svc_legalheir: /legal heir|varisu|heir cert|வாரிசு/i,
  svc_ec: /encumbrance|\bec\b|வில்லங்க/i,
  svc_chitta: /chitta|சிட்டா/i,
  svc_adangal: /adangal|a-register|அடங்கல்/i,
  svc_fmb: /fmb|field measurement|sketch|அளவைப் படம்/i,
  svc_rctransfer: /rc transfer|ownership transfer|transfer.*(rc|vehicle)|vehicle.*transfer/i,
  svc_duprc: /duplicate rc|lost rc|rc (lost|stolen)/i,
  svc_mvtax: /vehicle tax|road tax|mv tax|வாகன வரி/i,
  svc_echallan: /challan|traffic fine|சலான்/i,
  svc_proptax: /property tax|house tax|சொத்து வரி/i,
  svc_water: /water (charge|tax|bill)|metro ?water|குடிநீர்/i,
}

/** Curated officer-grade knowledge per service. */
const CURATED: Record<string, Pick<ServiceNode, 'tips' | 'commonMistakes' | 'rejectionReasons'>> = {
  svc_income: {
    tips: ['Valid for 6 months — time it just before scholarship season', 'The VAO may field-verify declared income'],
    commonMistakes: ['Income proof not matching the declared amount', 'Using an expired certificate for a new application'],
    rejectionReasons: ['Declared income contradicts the field report', 'Self-declaration missing'],
  },
  svc_community: {
    tips: ['SC/ST certificates are issued by the RDO, not the Tahsildar', 'Lifetime validity once issued'],
    commonMistakes: ['Applying without parent certificate or school TC evidence'],
    rejectionReasons: ['Community claim not corroborated by local inquiry'],
  },
  svc_birth: {
    tips: ['Free within 21 days; keep the RCH/PICME ID handy', 'Name can be added later (free < 12 months)'],
    commonMistakes: ['Missing the 21-day window and paying late penalties'],
    rejectionReasons: ['Delayed registration without Magistrate/RDO order'],
  },
  svc_death: {
    tips: ['Institutional deaths auto-transmit Form 4 — home deaths must be reported to the VAO'],
    commonMistakes: ['Delaying past 21 days — penalties escalate'],
    rejectionReasons: ['Cause-of-death certificate missing for institutional deaths'],
  },
  svc_marriage: {
    tips: ['Physical presence at the SRO is mandatory for both spouses and witnesses', 'SMA needs a 30-day notice + 3 witnesses'],
    commonMistakes: ['Booking the wrong Act — HMA needs both parties Hindu/Buddhist/Jain/Sikh'],
    rejectionReasons: ['Objection during the SMA notice period', 'Age proof below statutory minimum'],
  },
  svc_dl: {
    tips: ['30-day hold between LLR and the permanent test', 'Over 40 → Form 1A medical certificate is mandatory'],
    commonMistakes: ['Ignoring Form 1A when over 40', 'Letting the licence lapse > 1 year forces a re-test'],
    rejectionReasons: ['Failed driving test — rebook a slot', 'Pending e-Challans block renewal'],
  },
  svc_ration: {
    tips: ['Adding a spouse? They must first be deleted from the parental card', 'Address change re-maps your Fair Price Shop'],
    commonMistakes: ['Aadhaar already seeded to another card (de-duplication reject)'],
    rejectionReasons: ['Field inspection found no separate cooking arrangement'],
  },
  svc_patta: {
    tips: ['Joint transfer (REV-502) is faster than subdivision if you only need names added', 'Subdivision triggers a Firka Surveyor visit'],
    commonMistakes: ['Applying for subdivision when a joint patta suffices'],
    rejectionReasons: ['EC shows an encumbrance conflicting with the transfer'],
  },
  svc_residence: {
    tips: ['Uploaded address proof must exactly match the typed address'],
    commonMistakes: ['Mismatched address proof — the #1 correction reason'],
    rejectionReasons: ['VAO field verification could not confirm habitation'],
  },
  svc_nativity: {
    tips: ['For state-quota admissions you need Nativity, not Residence', 'Born outside TN? Claim through a parent’s nativity'],
    commonMistakes: ['Confusing Residence with Nativity', 'Missing 5-year school/employment evidence'],
    rejectionReasons: ['Five-year continuous residence not established'],
  },
  svc_legalheir: {
    tips: ['Class II heirs are now issued without civil court (G.O. 110/2024)', 'Local inquiry gathers ~10 references'],
    commonMistakes: ['Omitting a surviving heir — a criminal offence'],
    rejectionReasons: ['Heir list contradicted by local inquiry'],
  },
  svc_ec: {
    tips: ['Search back to 1987 (extent of computerised records) for real due diligence', 'Nil-EC (Form 16) means the window is clean'],
    commonMistakes: ['Querying too narrow a period', 'Wrong SRO selection'],
    rejectionReasons: ['Survey number not found in the selected SRO'],
  },
  svc_chitta: {
    tips: ['Chitta shows the revenue holder — the Sale Deed + EC dictate legal ownership', 'Ryotwari = private/buyable; Poramboke = government land'],
    commonMistakes: ['Treating the Chitta as title proof'],
    rejectionReasons: ['Survey/subdivision mismatch'],
  },
  svc_adangal: {
    tips: ['Patta proves ownership liability; Adangal proves cultivation status'],
    commonMistakes: ['Confusing Patta with Adangal for subsidy claims'],
    rejectionReasons: ['Patta number does not cross-reference the survey number'],
  },
  svc_fmb: {
    tips: ['No individual sketch for your subdivision? Apply Patta Subdivision to trigger a surveyor visit'],
    commonMistakes: ['Expecting an FMB for an un-subdivided share'],
    rejectionReasons: ['Sketch not digitised for the parcel'],
  },
  svc_rctransfer: {
    tips: ['Transfer insurance simultaneously or claims are denied', 'Check the seller’s challans before you buy'],
    commonMistakes: ['Skipping the bank NOC (Form 35) on financed vehicles'],
    rejectionReasons: ['Pending e-Challans on the vehicle', 'PUCC or insurance lapsed'],
  },
  svc_duprc: {
    tips: ['For a traffic stop, the DigiLocker/mParivahan virtual RC works instantly', 'Physical duplicate is only needed to sell'],
    commonMistakes: ['No FIR / Non-Traceable Certificate for lost or stolen cards'],
    rejectionReasons: ['Affidavit missing', 'Inspection slot not attended'],
  },
  svc_mvtax: {
    tips: ['Commercial vehicles pay quarterly — set reminders before each deadline'],
    commonMistakes: ['Letting arrears accumulate — penalties compound'],
    rejectionReasons: ['Vehicle records mismatch in Vahan'],
  },
  svc_echallan: {
    tips: ['Unpaid challans block RC transfer and DL renewal', 'Clear challans before selling your vehicle'],
    commonMistakes: ['Assuming challans lapse on their own'],
    rejectionReasons: ['Disputed challans must go through the enforcement cell'],
  },
  svc_proptax: {
    tips: ['Pay in the first 30 days of the half-year (Apr/Oct) for the 5% incentive (max ₹5,000)', 'Late payment adds 1% simple interest per month'],
    commonMistakes: ['Missing the incentive window'],
    rejectionReasons: ['Assessment under revision'],
  },
  svc_water: {
    tips: ['The 7% tax funds drainage; the volumetric charge is your usage', 'Above 25 KL you pay ₹40/KL — conservation pays'],
    commonMistakes: ['Confusing the fixed tax with the usage bill'],
    rejectionReasons: ['Consumer number not found'],
  },
}

/** Extra cross-service edges beyond life events. */
const EXTRA_EDGES: Record<string, string[]> = {
  svc_ec: ['svc_chitta', 'svc_patta'],
  svc_chitta: ['svc_adangal', 'svc_fmb', 'svc_ec'],
  svc_patta: ['svc_ec', 'svc_fmb', 'svc_proptax'],
  svc_legalheir: ['svc_death', 'svc_patta', 'svc_ration'],
  svc_rctransfer: ['svc_echallan', 'svc_mvtax'],
  svc_dl: ['svc_echallan'],
  svc_income: ['svc_community'],
  svc_nativity: ['svc_residence', 'svc_income'],
}

function relatedFor(id: string): string[] {
  const fromEvents = LIFE_EVENTS.filter((e) => e.services.includes(id)).flatMap((e) => e.services)
  const merged = [...new Set([...(EXTRA_EDGES[id] ?? []), ...fromEvents])].filter((s) => s !== id)
  return merged.slice(0, 5)
}

export const SERVICE_GRAPH: Record<string, ServiceNode> = Object.fromEntries(
  SERVICE_META.map((meta) => [
    meta.id,
    {
      meta,
      requirements: FORMS[meta.formId]?.documents ?? [],
      keywords: KEYWORDS[meta.id] ?? new RegExp(meta.name, 'i'),
      related: relatedFor(meta.id),
      tips: CURATED[meta.id]?.tips ?? [],
      commonMistakes: CURATED[meta.id]?.commonMistakes ?? [],
      rejectionReasons: CURATED[meta.id]?.rejectionReasons ?? [],
    } satisfies ServiceNode,
  ]),
)

export function findServicesInText(text: string): string[] {
  return Object.values(SERVICE_GRAPH)
    .filter((n) => n.keywords.test(text))
    .map((n) => n.meta.id)
}

export function getNode(serviceId: string): ServiceNode | undefined {
  return SERVICE_GRAPH[serviceId]
}

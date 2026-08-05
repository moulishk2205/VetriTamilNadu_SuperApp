/**
 * Life Event Engine — Vetri's signature knowledge.
 *
 * Each major life event is a graph node: trigger patterns (English + Tamil),
 * the ordered government services it implies (with dependency notes), benefits
 * to check, and what to recommend next. The planner expands events into
 * sequenced multi-service plans; nothing here is a reply — it is reasoning data.
 */

export interface LifeEvent {
  id: string
  label: string
  labelTamil: string
  /** Trigger patterns — matched by the intent engine, not by the LLM. */
  triggers: RegExp[]
  tone: 'empathetic' | 'celebratory' | 'neutral'
  /** Ordered service ids from the catalog; order encodes dependencies. */
  services: string[]
  /** Why this order — dependency notes keyed by serviceId. */
  dependencies: Record<string, string>
  /** Welfare/benefit angles to surface. */
  benefits: string[]
  /** What the citizen will likely need after this event settles. */
  futureRecommendations: string[]
}

export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'bereavement',
    label: 'Death in the family',
    labelTamil: 'குடும்பத்தில் இழப்பு',
    triggers: [/passed away|expired|died|death of|no more|இறந்து|மரணம்|காலமான/i],
    tone: 'empathetic',
    services: ['svc_death', 'svc_legalheir', 'svc_patta', 'svc_ration'],
    dependencies: {
      svc_legalheir: 'needs the Death Certificate first — every surviving heir must be listed (omission is an offence)',
      svc_patta: 'inherited land mutation needs the Legal Heir Certificate',
      svc_ration: 'member removal needs the Death Certificate',
    },
    benefits: ['Pension transfer and insurance claims both require the Death Certificate', 'Widow assistance schemes may apply'],
    futureRecommendations: ['Bank nominee updates', 'Property tax name change after mutation'],
  },
  {
    id: 'marriage',
    label: 'Marriage',
    labelTamil: 'திருமணம்',
    triggers: [/marri|wedding|கல்யாண|திருமண/i],
    tone: 'celebratory',
    services: ['svc_marriage', 'svc_ration', 'svc_residence'],
    dependencies: {
      svc_ration: 'spouse must first be removed from their parental card (NFSA de-duplication)',
      svc_residence: 'needed if the couple sets up a new household',
    },
    benefits: ['Marriage assistance schemes (Social Welfare)', 'Name-change gazette if applicable'],
    futureRecommendations: ['Nominee updates (bank/insurance)', 'Joint property patta if buying a home'],
  },
  {
    id: 'propertyPurchase',
    label: 'Property / land purchase',
    labelTamil: 'சொத்து வாங்குதல்',
    triggers: [/bought (a )?(land|house|home|plot|flat)|purchas\w+ (a )?(land|house|home|plot|property)|buying (a )?(land|house|plot)|நிலம் வாங்க|வீடு வாங்க|சொத்து/i],
    tone: 'neutral',
    services: ['svc_ec', 'svc_chitta', 'svc_patta', 'svc_proptax', 'svc_water'],
    dependencies: {
      svc_ec: 'due diligence first — search back to 1987 before you register',
      svc_patta: 'mutation after the registered sale deed',
      svc_proptax: 'name change follows the patta mutation',
      svc_water: 'new connection / name transfer after ownership is recorded',
    },
    benefits: ['First-time buyer stamp-duty concessions where applicable'],
    futureRecommendations: ['FMB sketch for boundary verification', 'Building-plan approval if constructing'],
  },
  {
    id: 'migration',
    label: 'Moving / address change',
    labelTamil: 'இடமாற்றம்',
    triggers: [/moved to|moving to|shifted|relocat|new address|சென்னைக்கு|இடம் மாற/i],
    tone: 'neutral',
    services: ['svc_dl', 'svc_ration', 'svc_residence'],
    dependencies: {
      svc_dl: 'address change on the licence via Sarathi',
      svc_ration: 'address change re-maps your Fair Price Shop',
      svc_residence: 'fresh residence certificate for the new jurisdiction',
    },
    benefits: [],
    futureRecommendations: ['Voter-ID address update (ECI portal)', 'Property tax / water accounts at the new address'],
  },
  {
    id: 'birth',
    label: 'New baby',
    labelTamil: 'குழந்தை பிறப்பு',
    triggers: [/baby|new ?born|gave birth|delivered|குழந்தை பிறந்த/i],
    tone: 'celebratory',
    services: ['svc_birth', 'svc_ration'],
    dependencies: {
      svc_birth: 'register within 21 days — it is free; needs the RCH/PICME ID',
      svc_ration: 'member addition needs the Birth Certificate',
    },
    benefits: ['Maternity assistance schemes', 'Immunisation tracking via PICME'],
    futureRecommendations: ['Aadhaar enrolment for the child', 'School admission will need Residence Certificate'],
  },
  {
    id: 'vehiclePurchase',
    label: 'Vehicle purchase',
    labelTamil: 'வாகனம் வாங்குதல்',
    triggers: [/bought (a )?(car|bike|vehicle|two.?wheeler)|new (car|bike|vehicle)|வண்டி வாங்க|கார் வாங்க/i],
    tone: 'neutral',
    services: ['svc_rctransfer', 'svc_echallan', 'svc_mvtax'],
    dependencies: {
      svc_rctransfer: 'used vehicle: transfer RC via Forms 29/30 — transfer insurance simultaneously or claims are denied',
      svc_echallan: 'clear the seller’s pending challans before transfer',
      svc_mvtax: 'verify lifetime tax status',
    },
    benefits: [],
    futureRecommendations: ['PUCC renewal reminders', 'Driving licence renewal if due'],
  },
  {
    id: 'education',
    label: 'School / college admission',
    labelTamil: 'கல்வி சேர்க்கை',
    triggers: [/school admission|college|engineering|scholarship|state quota|admission|படிப்பு|கல்லூரி|உதவித்தொகை/i],
    tone: 'neutral',
    services: ['svc_nativity', 'svc_income', 'svc_community', 'svc_residence'],
    dependencies: {
      svc_nativity: 'state-quota seats need Nativity (5-year residence), not just Residence',
      svc_income: 'scholarships need a live Income Certificate (valid 6 months)',
      svc_community: 'reservation benefits need the Community Certificate',
    },
    benefits: ['Fee concessions and scholarships by income band', 'First-graduate benefits'],
    futureRecommendations: ['Bus-pass applications', 'Hostel admission documents'],
  },
  {
    id: 'retirement',
    label: 'Retirement / senior citizen',
    labelTamil: 'ஓய்வு',
    triggers: [/retir|pension|senior citizen|60 years|ஓய்வூதியம்|முதியோர்/i],
    tone: 'neutral',
    services: ['svc_income', 'svc_legalheir'],
    dependencies: {
      svc_income: 'pension and concession claims often need a fresh Income Certificate',
    },
    benefits: ['Old-age pension (CM’s scheme)', 'Senior-citizen travel and health concessions'],
    futureRecommendations: ['Will registration at the SRO', 'Nominee reviews across accounts'],
  },
  {
    id: 'farming',
    label: 'Farming / agriculture',
    labelTamil: 'விவசாயம்',
    triggers: [/farmer|farming|crop|agricultur|subsidy|விவசாய|பயிர்/i],
    tone: 'neutral',
    services: ['svc_adangal', 'svc_chitta', 'svc_patta'],
    dependencies: {
      svc_adangal: 'crop-loss claims and subsidies verify cultivation via the Adangal',
      svc_chitta: 'ownership record must match the applicant',
    },
    benefits: ['PM-Kisan and state crop-insurance schemes', 'Free electricity for agriculture where applicable'],
    futureRecommendations: ['Well/borewell permissions', 'Land conversion needs DTCP + A-Register'],
  },
]

export function matchLifeEvents(text: string): LifeEvent[] {
  return LIFE_EVENTS.filter((e) => e.triggers.some((t) => t.test(text)))
}

export function getLifeEvent(id: string): LifeEvent | undefined {
  return LIFE_EVENTS.find((e) => e.id === id)
}

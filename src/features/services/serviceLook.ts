import type { ComponentType } from 'react'
import {
  AlertTriangle, ArrowRightLeft, Baby, Building2, Car, Droplet, FileSearch, Files, Flower2, HandCoins, Heart,
  HeartPulse, House, IndianRupee, Landmark, LandPlot, Map, MapPin, Receipt, Scale, Siren, Sparkles, Timer, Users, Wheat,
} from 'lucide-react'
import { resolveIcon } from '@/components/ui/iconRegistry'

type Icon = ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>

/** How a service is drawn wherever it appears: its icon on a solid colour tile. */
export interface ServiceLook {
  Icon: Icon
  colour: string
}

/**
 * One look per service, shared by the web portal and the phone app so a service
 * is recognisable at a glance on every screen. Colours follow what the service
 * is about, so related services read as related:
 *
 *   life events  — birth pink, marriage rose, death slate
 *   identity     — community indigo, legal heir violet, income green (money)
 *   belonging    — nativity and residence in teal
 *   transport    — blue, one family for licence, RC and road tax
 *   land records — earth brown for chitta, patta and encumbrance
 *   welfare      — ration orange, pension gold
 *   civic        — property tax plum, water cyan
 *   health       — mint
 *
 * Every colour carries a white icon at 3:1 or better.
 */
const LOOKS: Record<string, ServiceLook> = {
  svc_birth: { Icon: Baby, colour: '#D6336C' },
  svc_marriage: { Icon: Heart, colour: '#C2255C' },
  svc_death: { Icon: Flower2, colour: '#5C6B7A' },
  svc_community: { Icon: Users, colour: '#5B5BD6' },
  svc_legalheir: { Icon: Scale, colour: '#7048E8' },
  svc_income: { Icon: IndianRupee, colour: '#1E8E4E' },
  svc_nativity: { Icon: MapPin, colour: '#0C8599' },
  svc_residence: { Icon: House, colour: '#0B7285' },
  svc_dl: { Icon: Car, colour: '#1F6FEB' },
  svc_duprc: { Icon: Files, colour: '#1F6FEB' },
  svc_rctransfer: { Icon: ArrowRightLeft, colour: '#1F6FEB' },
  svc_mvtax: { Icon: Receipt, colour: '#1F6FEB' },
  svc_chitta: { Icon: Map, colour: '#9C5B2E' },
  svc_patta: { Icon: LandPlot, colour: '#9C5B2E' },
  svc_ec: { Icon: FileSearch, colour: '#9C5B2E' },
  svc_ration: { Icon: Wheat, colour: '#E8590C' },
  svc_pension: { Icon: HandCoins, colour: '#C77700' },
  svc_proptax: { Icon: Building2, colour: '#9C36B5' },
  svc_water: { Icon: Droplet, colour: '#1098AD' },
  svc_hospital: { Icon: HeartPulse, colour: '#0CA678' },
}

/** A service the app does not know yet still gets its family colour. */
const BY_CATEGORY: Record<string, string> = {
  cert: '#5B5BD6', rev: '#9C5B2E', trans: '#1F6FEB', health: '#0CA678', wel: '#C77700', civic: '#9C36B5',
}

export function serviceLook(id: string, iconName?: string, category?: string): ServiceLook {
  return LOOKS[id] ?? { Icon: resolveIcon(iconName), colour: (category && BY_CATEGORY[category]) || '#8A1C15' }
}

/** Documents are named the way citizens say them; match each to the service that issues it. */
const DOCUMENT_SERVICE: Record<string, string> = {
  'birth certificate': 'svc_birth', 'marriage certificate': 'svc_marriage', 'death certificate': 'svc_death',
  'community certificate': 'svc_community', 'legal heir certificate': 'svc_legalheir', 'income certificate': 'svc_income',
  'nativity certificate': 'svc_nativity', 'residence certificate': 'svc_residence', 'driving license': 'svc_dl',
  'registration certificate': 'svc_duprc', 'ration card': 'svc_ration', 'patta': 'svc_patta', 'chitta': 'svc_chitta',
  'encumbrance certificate': 'svc_ec',
}

/** The look of the service behind a document, or undefined when it is not one of ours. */
export function documentLook(name: string): ServiceLook | undefined {
  const key = name.toLowerCase().replace(/\(.*?\)/g, '').replace(/licence/g, 'license').replace(/\s+/g, ' ').trim()
  const id = DOCUMENT_SERVICE[key]
  return id ? LOOKS[id] : undefined
}

/** App features that sit beside services in shortcuts and search, drawn the same way. */
export const FEATURE_LOOKS = {
  complaint: { Icon: AlertTriangle, colour: '#DC2626' },
  tracker: { Icon: Timer, colour: '#D97706' },
  schemes: { Icon: Sparkles, colour: '#0891B2' },
  ai: { Icon: Sparkles, colour: '#7048E8' },
  emergency: { Icon: Siren, colour: '#E03131' },
  mla: { Icon: Landmark, colour: '#5B5BD6' },
} satisfies Record<string, ServiceLook>

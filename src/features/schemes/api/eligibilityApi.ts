import { z } from 'zod'
import { apiClient } from '@/lib/api/client'

const Verdict = z.enum(['eligible', 'not_eligible', 'needs_info', 'department_review'])
export type Verdict = z.infer<typeof Verdict>

const Condition = z.object({ text: z.string(), fact: z.string(), actual: z.union([z.string(), z.number()]).optional(), met: z.boolean().nullable() })
const SchemeResult = z.object({
  schemeId: z.string(), name: z.string(), nameTamil: z.string().optional(), benefit: z.string(), benefitTamil: z.string().optional(),
  department: z.string(), color: z.string(), verdict: Verdict, conditions: z.array(Condition), missing: z.array(z.string()),
  claim: z.object({ status: z.string(), at: z.string() }).optional(),
})
export type SchemeResult = z.infer<typeof SchemeResult>

const Facts = z.object({
  age: z.number().optional(), gender: z.string().optional(), district: z.string().optional(),
  annualIncome: z.number().optional(), landHolder: z.string().optional(), community: z.string().optional(),
  area: z.string().optional(), kutchaHut: z.string().optional(), studentLevel: z.string().optional(),
  schoolType: z.string().optional(), occupation: z.string().optional(), specialCategory: z.string().optional(),
  declaredAt: z.string().optional(),
})
export type Facts = z.infer<typeof Facts>
const CitizenEligibility = z.object({ facts: Facts, schemes: z.array(SchemeResult), newlyEligible: z.array(z.string()).optional() })
export type CitizenEligibility = z.infer<typeof CitizenEligibility>

const Simulation = z.object({ source: z.enum(['live', 'draft']), schemes: z.array(SchemeResult.omit({ claim: true })) })
export type Simulation = z.infer<typeof Simulation>

export type SampleProfile = Partial<Record<string, string | number>>

/** The facts a citizen can declare, with the choices the API accepts. */
export const FACT_INPUTS: { key: string; label: string; options?: [string, string][] }[] = [
  { key: 'annualIncome', label: 'Annual family income (₹)' },
  { key: 'landHolder', label: 'Do you own agricultural land?', options: [['yes', 'Yes'], ['no', 'No']] },
  { key: 'area', label: 'Where do you live?', options: [['rural', 'Rural area'], ['urban', 'Town or city']] },
  { key: 'kutchaHut', label: 'Do you live in a kutcha hut?', options: [['yes', 'Yes'], ['no', 'No']] },
  { key: 'community', label: 'Community', options: [['SC', 'SC (Adi Dravidar)'], ['ST', 'ST (Tribal)'], ['BC', 'BC'], ['MBC', 'MBC'], ['DNC', 'DNC'], ['OC', 'OC / Other']] },
  { key: 'studentLevel', label: 'Are you studying?', options: [['none', 'Not studying'], ['class-1-5', 'Classes I-V'], ['class-6-8', 'Classes VI-VIII'], ['class-9-10', 'Classes IX-X'], ['class-11', 'Class XI'], ['class-12', 'Class XII'], ['college', 'College']] },
  { key: 'schoolType', label: 'Type of school', options: [['government', 'Government'], ['aided', 'Government-aided'], ['private', 'Private']] },
  { key: 'occupation', label: 'Occupation', options: [['farmer', 'Farmer'], ['agricultural-labourer', 'Agricultural labourer'], ['traditional-fisher', 'Traditional fisher'], ['other', 'Other']] },
  { key: 'specialCategory', label: 'Do any of these apply?', options: [['none', 'None of these'], ['destitute-widow', 'Destitute widow'], ['deserted-woman', 'Deserted woman'], ['transgender', 'Transgender person'], ['disabled', 'Person with disability']] },
]

export const eligibilityApi = {
  mine: () => apiClient.get('/eligibility', { schema: CitizenEligibility }),
  declare: (facts: Partial<Record<string, string | number>>) => apiClient.put('/eligibility/facts', facts, { schema: CitizenEligibility }),
  claim: (schemeId: string) => apiClient.post(`/eligibility/${schemeId}/claim`),
  simulate: (profile: SampleProfile, xml?: string) => apiClient.post('/eligibility/simulate', { profile, xml }, { schema: Simulation }),
}

export const FACT_LABEL: Record<string, string> = {
  annualIncome: 'Annual income', landHolder: 'Agricultural land', age: 'Age', gender: 'Gender', district: 'District', community: 'Community',
  area: 'Area', kutchaHut: 'Kutcha hut', studentLevel: 'Studying', schoolType: 'School', occupation: 'Occupation', specialCategory: 'Category',
}

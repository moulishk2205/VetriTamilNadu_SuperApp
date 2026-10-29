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
  annualIncome: z.number().optional(), landHolder: z.enum(['yes', 'no']).optional(), declaredAt: z.string().optional(),
})
const CitizenEligibility = z.object({ facts: Facts, schemes: z.array(SchemeResult), newlyEligible: z.array(z.string()).optional() })
export type CitizenEligibility = z.infer<typeof CitizenEligibility>

const Simulation = z.object({ source: z.enum(['live', 'draft']), schemes: z.array(SchemeResult.omit({ claim: true })) })
export type Simulation = z.infer<typeof Simulation>

export interface SampleProfile { age?: number; gender?: string; district?: string; annualIncome?: number; landHolder?: 'yes' | 'no'; community?: string }

export const eligibilityApi = {
  mine: () => apiClient.get('/eligibility', { schema: CitizenEligibility }),
  declare: (facts: { annualIncome?: number; landHolder?: 'yes' | 'no' }) => apiClient.put('/eligibility/facts', facts, { schema: CitizenEligibility }),
  claim: (schemeId: string) => apiClient.post(`/eligibility/${schemeId}/claim`),
  simulate: (profile: SampleProfile, xml?: string) => apiClient.post('/eligibility/simulate', { profile, xml }, { schema: Simulation }),
}

export const FACT_LABEL: Record<string, string> = {
  annualIncome: 'Annual income', landHolder: 'Agricultural land', age: 'Age', gender: 'Gender', district: 'District', community: 'Community',
}

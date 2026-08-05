import { z } from 'zod'

export const SchemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  department: z.string(),
  benefit: z.string(),
  /** Match score (0-100) produced by the eligibility engine. */
  matchScore: z.number().int().min(0).max(100),
  color: z.string(),
  eligibility: z
    .object({
      incomeMax: z.number().optional(),
      categories: z.array(z.string()).optional(),
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
    })
    .optional(),
})
export type Scheme = z.infer<typeof SchemeSchema>

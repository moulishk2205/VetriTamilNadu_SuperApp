import { z } from 'zod'

export const DepartmentSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  category: z.string(),
})
export type Department = z.infer<typeof DepartmentSchema>

export const OfficerSchema = z.object({
  id: z.string(),
  name: z.string(),
  designation: z.string(),
  departmentId: z.string(),
  jurisdiction: z.string(),
})
export type Officer = z.infer<typeof OfficerSchema>

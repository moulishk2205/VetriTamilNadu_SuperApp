import { z } from 'zod'

export const AddressKind = z.enum(['current', 'permanent'])
export type AddressKind = z.infer<typeof AddressKind>

export const AddressSchema = z.object({
  id: z.string(),
  kind: AddressKind,
  line: z.string(),
  area: z.string(),
  district: z.string(),
  state: z.string(),
  pincode: z.string(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
})
export type Address = z.infer<typeof AddressSchema>

export const FamilyMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  relation: z.string(),
  age: z.number().int().optional(),
  citizenId: z.string().optional(),
})
export type FamilyMember = z.infer<typeof FamilyMemberSchema>

export const CitizenSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  fullName: z.string(),
  dob: z.string(),
  gender: z.string(),
  mobile: z.string(),
  email: z.string().optional(),
  aadhaarMasked: z.string(),
  district: z.string(),
  taluk: z.string(),
  state: z.string(),
  verified: z.boolean(),
  verifiedVia: z.array(z.string()).default([]),
  addresses: z.array(AddressSchema).default([]),
  family: z.array(FamilyMemberSchema).default([]),
})
export type Citizen = z.infer<typeof CitizenSchema>

import { z } from 'zod'

/** Shared field primitives used across every domain model. */
export const zId = z.string().min(1)
/** ISO-8601 datetime string (backend-friendly, JSON-serializable). */
export const zIsoDate = z.string()
export const zMoneyINR = z.number().nonnegative()

export type Id = string
export type IsoDate = string

/** Standard paginated envelope every list endpoint returns. */
export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().nonnegative(),
    pageSize: z.number().int().positive(),
  })
export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

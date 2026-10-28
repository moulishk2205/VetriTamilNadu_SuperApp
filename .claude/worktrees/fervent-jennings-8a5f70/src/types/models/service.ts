import { z } from 'zod'

/** An entry in the services catalog (Services Hub). Phase 2 attaches a real
 *  application form + department integration to each via `id`. */
export const ServiceCatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  processingTime: z.string(),
  fee: z.string(),
  popular: z.boolean().default(false),
  icon: z.string(),
})
export type ServiceCatalogItem = z.infer<typeof ServiceCatalogItemSchema>

export const ServiceCategorySchema = z.object({ id: z.string(), label: z.string() })
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>

import { apiClient } from '@/lib/api/client'
import { PageSchema } from '@/types/models/common'
import { ServiceCatalogItemSchema, ServiceCategorySchema, type ServiceCatalogItem, type ServiceCategory } from '@/types/models/service'

export const servicesApi = {
  list: (): Promise<ServiceCatalogItem[]> =>
    apiClient.get('/services', { schema: PageSchema(ServiceCatalogItemSchema) }).then((r) => r.items),
  categories: (): Promise<ServiceCategory[]> =>
    apiClient.get('/service-categories', { schema: PageSchema(ServiceCategorySchema) }).then((r) => r.items),
}

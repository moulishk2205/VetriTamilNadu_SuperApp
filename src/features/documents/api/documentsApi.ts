import { apiClient } from '@/lib/api/client'
import { PageSchema } from '@/types/models/common'
import { DocumentSchema, type WalletDocument } from '@/types/models/document'

/**
 * Documents API. The only module that talks to the transport layer for wallet
 * documents; hooks and components depend on this, never on `apiClient` directly.
 */
export const documentsApi = {
  list: (): Promise<WalletDocument[]> =>
    apiClient.get('/documents', { schema: PageSchema(DocumentSchema) }).then((r) => r.items),
  get: (id: string): Promise<WalletDocument> =>
    apiClient.get(`/documents/${id}`, { schema: DocumentSchema }),
}

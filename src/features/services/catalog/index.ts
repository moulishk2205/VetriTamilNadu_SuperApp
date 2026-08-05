import type { FormDefinition } from '@/lib/forms/types'
import type { ServiceMeta } from './types'
import { SERVICE_META, SERVICE_META_BY_ID } from './meta'
import { FORMS } from './forms'

export type { ServiceMeta } from './types'
export { SERVICE_META, SERVICE_META_BY_ID } from './meta'

/** All catalog services (drives Services Hub + Search). */
export function listServices(): ServiceMeta[] {
  return SERVICE_META
}

export function getServiceMeta(serviceId: string): ServiceMeta | undefined {
  return SERVICE_META_BY_ID[serviceId]
}

/** The Form Engine definition a service renders for its application. */
export function getServiceForm(serviceId: string): FormDefinition | undefined {
  const meta = SERVICE_META_BY_ID[serviceId]
  return meta ? FORMS[meta.formId] : undefined
}

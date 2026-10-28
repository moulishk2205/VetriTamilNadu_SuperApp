/**
 * Service catalog types.
 *
 * A `ServiceMeta` is the official-facing description of a government service.
 * Values are sourced from the Government of Tamil Nadu official research report
 * (e-Sevai, TNREGINET, Parivahan, TNPDS, TamilNilam, GCC/CRSTN citizen charters)
 * — see each entry's `sourceUrl`. It references a `FormDefinition` (Form Engine)
 * and a workflow (Workflow Engine); it invents no flow of its own.
 */

export type ServiceMode =
  | 'digital' // fully completed inside Vetri (mock backend now, TN dept API later)
  | 'assisted' // Vetri collects + prefills, then hands off to an external portal
  | 'external' // informational; must be done on the official portal

/** A sub-variant of a service (e.g. Late Registration, LLR vs Permanent DL). */
export interface SubService {
  id: string
  name: string
  /** e-Sevai / portal service code, e.g. REV-501. */
  code?: string
  fee: string
  processingTime: string
  note?: string
}

export interface ServiceMeta {
  id: string
  /** Official e-Sevai / portal service code, e.g. REV-103. */
  serviceCode: string
  name: string
  nameTamil?: string
  /** category id matching the ServicesHub filters (cert/trans/rev/wel/health/edu). */
  category: string
  department: string
  subDepartment?: string
  /** Governing Act / Rules / GO. */
  legalBasis: string
  acts: string[]
  /** Field → verification → issuing officer chain. */
  officerHierarchy: string[]
  authorities: { issuing: string; escalation?: string; appeal?: string }

  processingTime: string
  /** Total payable = govFee + serviceCharge. */
  fee: string
  govFee: string
  serviceCharge: string
  paymentModes: string[]

  mode: ServiceMode
  description: string
  eligibility: string[]
  disqualifications?: string[]
  subServices?: SubService[]

  certificateValidity: string
  digitalFeatures: string[]
  qrVerification: boolean
  digiLockerSupport: boolean
  aadhaarEKyc: boolean
  eSign: boolean
  appointmentRequired: boolean

  correctionWorkflow: string
  rejectionWorkflow: string
  appealWorkflow: string

  /** Workflow Engine definition id that a submission starts. */
  workflowId: string
  /** Form Engine definition id rendered for the application. */
  formId: string
  icon: string

  /** Assisted/external services: the official portal to hand off to. */
  externalUrl?: string
  externalName?: string
  /** The certificate/document type produced on approval (for wallet delivery). */
  producesDocumentType?: string

  /** Official portal + provenance. */
  portalUrl: string
  sourceUrl: string
  sourceNote: string
}

/**
 * Form Engine — types.
 *
 * Every government service form (birth certificate, patta transfer, licence…)
 * is a `FormDefinition` — data, not bespoke JSX. Phase 2 authors definitions;
 * a single renderer + this engine drive them all.
 */

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'tel' | 'email'
  | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'aadhaar'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldValidation {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  message?: string
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  options?: FieldOption[]
  validation?: FieldValidation
  /** Conditional visibility: show only when another field equals a value. */
  visibleWhen?: { field: string; equals: string | number | boolean }
  /** File fields: accepted mime types + max size. */
  accept?: string[]
  maxSizeBytes?: number
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

export interface DocumentRequirement {
  id: string
  label: string
  required: boolean
  /** Where the doc can be auto-pulled from (Integration Gateway capability). */
  source?: 'digilocker' | 'upload'
  /** Accepted format groups (official portal constraint), e.g. ['pdf','jpeg','png']. */
  acceptedFormats?: string[]
  /** Maximum upload size in KB (official portal constraint). */
  maxSizeKB?: number
  /** Human note on when this document applies (e.g. 'Late registration > 1 year'). */
  appliesWhen?: string
}

export interface FormDefinition {
  id: string
  serviceId: string
  title: string
  sections: FormSection[]
  documents: DocumentRequirement[]
  /** Workflow this form's submission starts. */
  workflowId: string
  /** Whether drafts may be saved before submission. */
  allowDraft: boolean
}

export type FormValues = Record<string, unknown>

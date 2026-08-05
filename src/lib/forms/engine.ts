import { z, type ZodTypeAny } from 'zod'
import type { FormDefinition, FormField, FormValues } from './types'

/**
 * Form Engine — turns a `FormDefinition` into runtime behaviour: visibility
 * evaluation, a Zod validation schema, and validation results. Service-agnostic.
 */

export function allFields(def: FormDefinition): FormField[] {
  return def.sections.flatMap((s) => s.fields)
}

/** Whether a field is currently visible given the entered values. */
export function isVisible(field: FormField, values: FormValues): boolean {
  if (!field.visibleWhen) return true
  return values[field.visibleWhen.field] === field.visibleWhen.equals
}

function fieldSchema(field: FormField): ZodTypeAny {
  const v = field.validation ?? {}
  let base: ZodTypeAny

  switch (field.type) {
    case 'number':
      base = z.coerce.number()
      if (v.min !== undefined) base = (base as z.ZodNumber).min(v.min)
      if (v.max !== undefined) base = (base as z.ZodNumber).max(v.max)
      break
    case 'checkbox':
      base = z.boolean()
      break
    case 'aadhaar':
      base = z.string().regex(/^\d{12}$/, v.message ?? 'Enter a 12-digit Aadhaar')
      break
    case 'email':
      base = z.string().email()
      break
    default: {
      let s = z.string()
      if (v.minLength !== undefined) s = s.min(v.minLength)
      if (v.maxLength !== undefined) s = s.max(v.maxLength)
      if (v.pattern) s = s.regex(new RegExp(v.pattern), v.message)
      base = s
    }
  }

  return v.required ? base : base.optional()
}

/** Build a Zod schema covering only the currently-visible required fields. */
export function buildSchema(def: FormDefinition, values: FormValues): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {}
  for (const field of allFields(def)) {
    if (isVisible(field, values)) shape[field.id] = fieldSchema(field)
  }
  return z.object(shape)
}

export interface ValidationResult {
  ok: boolean
  errors: Record<string, string>
}

export function validate(def: FormDefinition, values: FormValues): ValidationResult {
  const parsed = buildSchema(def, values).safeParse(values)
  if (parsed.success) return { ok: true, errors: {} }
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}

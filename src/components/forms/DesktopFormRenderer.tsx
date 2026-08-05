import { AlertTriangle } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { isVisible } from '@/lib/forms/engine'
import type { FormDefinition, FormField, FormValues } from '@/lib/forms/types'

/**
 * Desktop form renderer.
 *
 * Same Form Engine, desktop presentation: sections become titled panels and
 * fields flow in a responsive two-column grid (textareas and long fields span
 * the full width). Conditional visibility comes from `isVisible()` — the exact
 * rule the mobile renderer uses — so there is one validation/visibility source.
 */
const FULL_WIDTH: FormField['type'][] = ['textarea']

export function DesktopFormRenderer({
  def,
  values,
  errors,
  onChange,
}: {
  def: FormDefinition
  values: FormValues
  errors: Record<string, string>
  onChange: (fieldId: string, value: unknown) => void
}) {
  const c = useC()

  const base: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 10, border: `1px solid ${c.bdr}`,
    background: c.bg, color: c.txt, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }
  const errored = (id: string): React.CSSProperties => (errors[id] ? { borderColor: c.err, background: `${c.err}06` } : {})

  const renderField = (f: FormField) => {
    const val = values[f.id]
    const common = { id: f.id, style: { ...base, ...errored(f.id) }, 'aria-invalid': Boolean(errors[f.id]) }

    switch (f.type) {
      case 'textarea':
        return <textarea {...common} rows={4} value={String(val ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(f.id, e.target.value)} style={{ ...common.style, resize: 'vertical', lineHeight: 1.6 }} />

      case 'select':
        return (
          <select {...common} value={String(val ?? '')} onChange={(e) => onChange(f.id, e.target.value)} style={{ ...common.style, cursor: 'pointer' }}>
            <option value="">Select…</option>
            {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )

      case 'radio':
        return (
          <div role="radiogroup" aria-labelledby={`${f.id}-label`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(f.options ?? []).map((o) => {
              const on = String(val ?? '') === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange(f.id, o.value)}
                  style={{ padding: '10px 15px', borderRadius: 10, border: `1px solid ${on ? c.pri : c.bdr}`, background: on ? `${c.pri}0F` : c.bg, color: on ? c.pri : c.txt2, fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        )

      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13.5, color: c.txt, lineHeight: 1.55 }}>
            <input type="checkbox" checked={Boolean(val)} onChange={(e) => onChange(f.id, e.target.checked)} style={{ width: 17, height: 17, accentColor: c.pri, marginTop: 1, cursor: 'pointer' }} />
            {f.label}
          </label>
        )

      case 'aadhaar':
        return (
          <input
            {...common}
            className="vtn-num"
            inputMode="numeric"
            value={String(val ?? '')}
            placeholder={f.placeholder ?? 'XXXX XXXX XXXX'}
            onChange={(e) => onChange(f.id, e.target.value.replace(/\D/g, '').slice(0, 12))}
            style={{ ...common.style, letterSpacing: 2 }}
          />
        )

      case 'number':
      case 'tel':
        return (
          <input
            {...common}
            className="vtn-num"
            inputMode="numeric"
            value={String(val ?? '')}
            placeholder={f.placeholder}
            onChange={(e) => onChange(f.id, f.type === 'tel' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value)}
          />
        )

      case 'date':
        return <input {...common} type="date" value={String(val ?? '')} onChange={(e) => onChange(f.id, e.target.value)} style={{ ...common.style, cursor: 'pointer' }} />

      case 'email':
        return <input {...common} type="email" value={String(val ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(f.id, e.target.value)} />

      default:
        return <input {...common} type="text" value={String(val ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(f.id, e.target.value)} />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {def.sections.map((section) => {
        const visible = section.fields.filter((f) => isVisible(f, values))
        if (visible.length === 0) return null
        return (
          <section key={section.id} className="vtn-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.bdr}`, background: c.bgAlt }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: c.txt }}>{section.title}</h3>
              {section.description && <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 3, lineHeight: 1.55 }}>{section.description}</p>}
            </div>

            <div style={{ padding: 20, display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
              {visible.map((f) => {
                const span = FULL_WIDTH.includes(f.type) || f.type === 'checkbox'
                return (
                  <div key={f.id} style={{ gridColumn: span ? '1 / -1' : undefined, minWidth: 0 }}>
                    {f.type !== 'checkbox' && (
                      <label id={`${f.id}-label`} htmlFor={f.id} style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: c.txt2, marginBottom: 7 }}>
                        {f.label}
                        {f.validation?.required && <span style={{ color: c.err, marginLeft: 3 }}>*</span>}
                      </label>
                    )}
                    {renderField(f)}
                    {errors[f.id] && (
                      <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: c.err, marginTop: 6 }}>
                        <AlertTriangle size={12} />{errors[f.id]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

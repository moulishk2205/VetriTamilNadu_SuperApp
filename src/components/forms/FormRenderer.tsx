import { useC } from '@/hooks/useUi'
import { isVisible } from '@/lib/forms/engine'
import type { FormDefinition, FormField, FormValues } from '@/lib/forms/types'

/**
 * The single renderer for every service form. Given a `FormDefinition` it draws
 * sections + fields using the app's existing input styling, evaluates
 * conditional visibility, and surfaces per-field validation errors. No service
 * ships its own form JSX.
 */
export function FormRenderer({
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

  const labelStyle = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: c.txt } as const
  const inputStyle = (err?: string) => ({
    width: '100%', border: `1.5px solid ${err ? c.err : c.bdr}`, borderRadius: 16, padding: '14px 16px',
    fontSize: 15, fontFamily: 'inherit', outline: 'none', background: c.bg, color: c.txt,
  } as const)

  const renderField = (f: FormField) => {
    if (!isVisible(f, values)) return null
    const err = errors[f.id]
    const val = values[f.id]

    let control
    if (f.type === 'select') {
      control = (
        <select value={(val as string) ?? ''} onChange={(e) => onChange(f.id, e.target.value)} style={{ ...inputStyle(err), appearance: 'none' }}>
          <option value="">Select…</option>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    } else if (f.type === 'radio') {
      control = (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {f.options?.map((o) => {
            const active = val === o.value
            return (
              <button key={o.value} type="button" onClick={() => onChange(f.id, o.value)} style={{ padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${active ? c.pri : c.bdr}`, background: active ? `${c.pri}08` : c.card, color: active ? c.pri : c.txt, fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>{o.label}</button>
            )
          })}
        </div>
      )
    } else if (f.type === 'textarea') {
      control = <textarea value={(val as string) ?? ''} onChange={(e) => onChange(f.id, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle(err), height: 96, resize: 'none' }} />
    } else if (f.type === 'checkbox') {
      control = (
        <button type="button" onClick={() => onChange(f.id, !val)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${val ? c.pri : c.bdr}`, background: val ? c.pri : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>{val ? '✓' : ''}</span>
          <span style={{ fontSize: 14, color: c.txt }}>{f.label}</span>
        </button>
      )
    } else {
      const type = f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : 'text'
      control = (
        <input
          type={type}
          value={(val as string) ?? ''}
          inputMode={f.type === 'aadhaar' || f.type === 'tel' || f.type === 'number' ? 'numeric' : undefined}
          onChange={(e) => onChange(f.id, e.target.value)}
          placeholder={f.placeholder}
          style={inputStyle(err)}
        />
      )
    }

    return (
      <div key={f.id} style={{ marginBottom: 16 }}>
        {f.type !== 'checkbox' && <label style={labelStyle}>{f.label}</label>}
        {control}
        {err && <p style={{ fontSize: 12, color: c.err, marginTop: 6 }}>{err}</p>}
      </div>
    )
  }

  return (
    <div>
      {def.sections.map((section) => {
        const visibleFields = section.fields.filter((f) => isVisible(f, values))
        if (visibleFields.length === 0) return null
        return (
          <div key={section.id} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>{section.title}</p>
            {section.description && <p style={{ fontSize: 12, color: c.txt2, marginBottom: 12 }}>{section.description}</p>}
            {section.fields.map(renderField)}
          </div>
        )
      })}
    </div>
  )
}

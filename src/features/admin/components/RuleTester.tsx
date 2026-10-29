import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FlaskConical, Upload } from 'lucide-react'
import { Card, Btn } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { normalizeError } from '@/lib/api/errors'
import { eligibilityApi, FACT_INPUTS, type SampleProfile, type Simulation, type Verdict } from '@/features/schemes/api/eligibilityApi'

const VERDICT: Record<Verdict, { label: string; tone: 'ok' | 'err' | 'warn' | 'txt3' }> = {
  eligible: { label: 'Eligible', tone: 'ok' },
  not_eligible: { label: 'Not eligible', tone: 'err' },
  needs_info: { label: 'Needs more details', tone: 'warn' },
  department_review: { label: 'Department decides', tone: 'txt3' },
}

/**
 * For officers and administrators: try a sample citizen against the live
 * scheme rules, or against a DMN draft before it is imported, and see each
 * condition met or not. Nothing is saved.
 */
export function RuleTester({ collapsible = false }: { collapsible?: boolean }) {
  const c = useC()
  const [open, setOpen] = useState(!collapsible)
  const [p, setP] = useState<Record<string, string>>({ age: '30', gender: 'Female', district: 'Chennai', annualIncome: '180000', landHolder: 'yes', area: 'rural' })
  const [draft, setDraft] = useState<{ name: string; xml: string } | null>(null)
  const [result, setResult] = useState<Simulation | null>(null)
  const [error, setError] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const run = useMutation({
    mutationFn: () => {
      const profile: SampleProfile = Object.fromEntries(Object.entries(p)
        .map(([k, v]) => [k, v.trim()] as const)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => [k, k === 'age' || k === 'annualIncome' ? Math.round(Number(v)) : v]))
      return eligibilityApi.simulate(profile, draft?.xml)
    },
    onSuccess: (r) => { setResult(r); setError([]) },
    onError: (e) => {
      const err = normalizeError(e)
      setError(err.fieldErrors?._?.length ? err.fieldErrors._ : [err.message])
    },
  })

  const field = (label: string, key: string, input: React.ReactNode) => (
    <label key={key} style={{ fontSize: 11.5, color: c.txt2, display: 'grid', gap: 4 }}>{label}{input}</label>
  )
  const box = { padding: '8px 10px', borderRadius: 9, border: `1px solid ${c.bdr}`, background: c.card, color: c.txt, fontSize: 13 } as const

  return (
    <Card style={{ marginTop: 14 }}>
      <button onClick={() => collapsible && setOpen((v) => !v)} style={{ all: 'unset', cursor: collapsible ? 'pointer' : 'default', display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
        <FlaskConical size={18} color={c.pri} />
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: c.txt }}>Test eligibility rules</span>
          <span style={{ display: 'block', fontSize: 12, color: c.txt2, marginTop: 2 }}>Try a sample citizen against the live scheme rules, or a DMN draft before it is published. Nothing is saved.</span>
        </span>
        {collapsible && <span style={{ fontSize: 12, color: c.pri, fontWeight: 600 }}>{open ? 'Hide' : 'Open'}</span>}
      </button>

      {open && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, alignItems: 'flex-end' }}>
            {field('Age', 'age', <input type="number" min={0} value={p.age} onChange={(e) => setP({ ...p, age: e.target.value })} style={{ ...box, width: 80 }} />)}
            {field('Gender', 'gender', (
              <select value={p.gender} onChange={(e) => setP({ ...p, gender: e.target.value })} style={box}>
                <option value="">Unknown</option><option>Female</option><option>Male</option><option>Transgender</option>
              </select>
            ))}
            {field('District', 'district', <input value={p.district} onChange={(e) => setP({ ...p, district: e.target.value })} style={{ ...box, width: 130 }} />)}
            {field('Annual income (₹)', 'annualIncome', <input type="number" min={0} value={p.annualIncome} onChange={(e) => setP({ ...p, annualIncome: e.target.value })} style={{ ...box, width: 130 }} />)}
            {FACT_INPUTS.filter((f) => f.options).map((f) => field(f.label, f.key, (
              <select value={p[f.key] ?? ''} onChange={(e) => setP({ ...p, [f.key]: e.target.value })} style={box}>
                <option value="">Unknown</option>
                {f.options!.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            )))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn variant="primary" disabled={run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'Testing…' : draft ? 'Test against the draft' : 'Test against live rules'}</Btn>
            <Btn variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>{draft ? `Draft: ${draft.name}` : 'Use a DMN draft…'}</Btn>
            {draft && <Btn variant="outline" onClick={() => { setDraft(null); setResult(null) }}>Back to live rules</Btn>}
            <input ref={fileRef} type="file" accept=".dmn,.xml" hidden onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) { setDraft({ name: file.name, xml: await file.text() }); setResult(null) }
            }} />
          </div>

          {error.length > 0 && <ul role="alert" style={{ marginTop: 12, paddingLeft: 18, color: c.err, fontSize: 12.5 }}>{error.map((x, i) => <li key={i}>{x}</li>)}</ul>}

          {result && (
            <div role="status" style={{ marginTop: 14, overflowX: 'auto' }}>
              <p style={{ fontSize: 12, color: c.txt3, marginBottom: 8 }}>Result against the {result.source === 'draft' ? `draft (${draft?.name ?? 'DMN'}), not saved` : 'live rules'}:</p>
              <table className="vtn-table" style={{ width: '100%', fontSize: 12.5 }}>
                <thead><tr><th style={{ textAlign: 'left' }}>Scheme</th><th style={{ textAlign: 'left' }}>Result</th><th style={{ textAlign: 'left' }}>Conditions</th></tr></thead>
                <tbody>
                  {result.schemes.map((s) => (
                    <tr key={s.schemeId}>
                      <td style={{ fontWeight: 600, color: c.txt }}>{s.name}</td>
                      <td style={{ color: c[VERDICT[s.verdict].tone], fontWeight: 700, whiteSpace: 'nowrap' }}>{VERDICT[s.verdict].label}</td>
                      <td style={{ color: c.txt2 }}>
                        {s.conditions.length === 0 ? 'No automatic check' : s.conditions.map((x) => `${x.met === true ? '✓' : x.met === false ? '✗' : '?'} ${x.text}`).join('  ·  ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

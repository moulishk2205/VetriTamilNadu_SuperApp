import { useEffect, useState } from 'react'
import { z } from 'zod'
import { BadgeCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useC } from '@/hooks/useUi'
import { Seal } from '@/components/ui'

const VerifySchema = z.object({
  authentic: z.boolean(),
  reason: z.string(),
  number: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  issuer: z.string().optional(),
  holder: z.string().optional(),
  validity: z.string().optional(),
  status: z.string().optional(),
  issuedOn: z.string().optional(),
})
type Result = z.infer<typeof VerifySchema>

/**
 * Public certificate verification: the page behind the QR code on every
 * certificate. No sign-in and no experience picker; a bank or school clerk
 * scans the code and sees, straight from the issuing system, whether the
 * certificate is genuine and unaltered. The holder's name is masked.
 */
export default function VerifyCertificate() {
  const c = useC()
  const number = decodeURIComponent(window.location.pathname.replace(/^\/verify\//, '').replace(/\/$/, ''))
  const sig = new URLSearchParams(window.location.search).get('s') ?? ''
  const [result, setResult] = useState<Result | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    apiClient
      .get(`/verify/${encodeURIComponent(number)}?s=${encodeURIComponent(sig)}`, { schema: VerifySchema, auth: false })
      .then(setResult)
      .catch(() => setFailed(true))
  }, [number, sig])

  const ok = result?.authentic === true
  const tone = ok ? c.ok : c.err
  const rows: [string, string | undefined][] = result
    ? [['Certificate', result.name], ['Number', result.number], ['Issued by', result.issuer], ['Holder', result.holder], ['Issued on', result.issuedOn], ['Validity', result.validity]]
    : []

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: c.bgAlt }}>
      <div style={{ width: 'min(100%, 460px)', background: c.card, borderRadius: 20, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Seal size={40} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: c.txt }}>VETRI certificate check</p>
            <p style={{ fontSize: 12, color: c.txt2 }}>Verified against the issuing system, live</p>
          </div>
        </div>

        {!result && !failed && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, color: c.txt2, fontSize: 14 }}>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Checking certificate {number}…
          </p>
        )}
        {failed && <p role="alert" style={{ marginTop: 28, color: c.err, fontSize: 14 }}>The verification service could not be reached. Try again shortly.</p>}

        {result && (
          <>
            <div role="status" style={{ marginTop: 24, padding: 18, borderRadius: 14, background: `${tone}12`, border: `1px solid ${tone}40`, display: 'flex', gap: 14, alignItems: 'center' }}>
              {ok ? <BadgeCheck size={40} color={tone} aria-hidden="true" /> : <ShieldAlert size={40} color={tone} aria-hidden="true" />}
              <div>
                <p style={{ fontSize: 19, fontWeight: 800, color: tone }}>{ok ? 'Genuine certificate' : 'Not verified'}</p>
                <p style={{ fontSize: 13, color: c.txt2, marginTop: 3, lineHeight: 1.45 }}>{result.reason}</p>
              </div>
            </div>
            {rows.some(([, v]) => v) && (
              <dl style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '9px 16px' }}>
                {rows.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt style={{ fontSize: 12.5, color: c.txt3 }}>{k}</dt>
                    <dd style={{ fontSize: 13.5, color: c.txt, fontWeight: 600 }}>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
        <p style={{ marginTop: 22, fontSize: 11, color: c.txt3, lineHeight: 1.5 }}>
          The QR code carries a signature over the printed details. Changing the name, number, issuer or validity on a copy makes this check fail.
        </p>
      </div>
    </main>
  )
}

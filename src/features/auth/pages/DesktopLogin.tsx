import { useState } from 'react'
import { ShieldCheck, BadgeCheck, FileText, Clock, Landmark, ArrowRight, Loader2 } from 'lucide-react'
import { Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAuth } from '@/features/auth/hooks/useAuth'

const BENEFITS = [
  { icon: FileText, t: 'Apply for 20+ services', d: 'Certificates, licences, ration card, land records — one verified profile.' },
  { icon: Clock, t: 'Track under Right to Service', d: 'Statutory timelines, assigned officer and live stage for every application.' },
  { icon: BadgeCheck, t: 'Verified digital documents', d: 'Approved certificates delivered straight into your digital locker.' },
  { icon: Landmark, t: 'Transparent governance', d: 'Department performance and constituency scorecards, open to every citizen.' },
]

/**
 * Desktop-first login for the Government Web Portal.
 *
 * A full-viewport split: a branded government hero on the left and a focused
 * authentication panel on the right. It performs the SAME OTP round-trip as the
 * mobile login (`requestOtp` → `login`) — no duplicated auth logic.
 */
export default function DesktopLogin({ onDone }: { onDone: () => void }) {
  const c = useC()
  const { login, requestOtp } = useAuth()
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const sendOtp = async () => {
    if (mobile.replace(/\D/g, '').length !== 10) return setError('Enter a valid 10-digit mobile number.')
    setError(''); setBusy(true)
    try {
      await requestOtp(mobile, 'otp')
      setStep('otp')
    } catch {
      setError('Could not send the OTP. Check your connection and try again.')
    } finally { setBusy(false) }
  }

  const verify = async () => {
    if (otp.replace(/\D/g, '').length !== 6) return setError('Enter the 6-digit OTP.')
    setError(''); setBusy(true)
    try {
      await login({ method: 'otp', identifier: mobile, otp })
      onDone()
    } catch {
      setError('That OTP was not accepted. Please try again.')
    } finally { setBusy(false) }
  }

  const field: React.CSSProperties = { width: '100%', padding: '13px 15px', borderRadius: 11, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 15, fontFamily: 'inherit', outline: 'none' }

  return (
    <div className="vtn-login">
      {/* ── Government hero ─────────────────────────────────────────── */}
      <div className="vtn-login__hero" style={{ background: `linear-gradient(150deg, ${c.pri} 0%, ${c.acc} 100%)`, padding: 'clamp(32px, 4vw, 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', bottom: '-12%', right: '-8%', opacity: 0.08, filter: 'grayscale(1) brightness(1.8)', pointerEvents: 'none' }}>
          <Seal size={620} />
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Seal size={52} />
          <div>
            <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>Vetri Tamil Nadu</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', marginTop: 2 }}>வெற்றி தமிழ்நாடு · e-Sevai Digital Services</p>
          </div>
        </div>

        <div style={{ position: 'relative', marginBlock: 'clamp(28px, 4vw, 48px)' }}>
          <h1 className="vtn-h1" style={{ color: '#fff', maxWidth: '18ch' }}>One citizen identity for every government service.</h1>
          <p className="vtn-lede" style={{ color: 'rgba(255,255,255,0.76)', marginTop: 14 }}>
            The official digital gateway of the Government of Tamil Nadu — apply, track and receive government services without visiting an office.
          </p>

          <div style={{ display: 'grid', gap: 'clamp(12px, 1.4vw, 20px)', marginTop: 'clamp(24px, 3vw, 40px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))' }}>
            {BENEFITS.map((b) => (
              <div key={b.t} style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <b.icon size={17} color={c.secLt} />
                </span>
                <span>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{b.t}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.64)', marginTop: 3, lineHeight: 1.55 }}>{b.d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>
          © {new Date().getFullYear()} Government of Tamil Nadu · Secured by Aadhaar-linked verification
        </p>
      </div>

      {/* ── Authentication panel ────────────────────────────────────── */}
      <div style={{ background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(28px, 4vw, 56px)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: c.pri, background: `${c.pri}0F`, padding: '6px 12px', borderRadius: 8 }}>
            <ShieldCheck size={13} /> Secure Citizen Login
          </span>

          <h2 style={{ fontSize: 'clamp(21px, 1.7vw, 27px)', fontWeight: 800, color: c.txt, marginTop: 18, letterSpacing: -0.4 }}>
            {step === 'mobile' ? 'Sign in to your account' : 'Enter the verification code'}
          </h2>
          <p style={{ fontSize: 13.5, color: c.txt2, marginTop: 8, lineHeight: 1.6 }}>
            {step === 'mobile'
              ? 'We will send a one-time password to your Aadhaar-linked mobile number.'
              : `A 6-digit code was sent to +91 ${mobile}.`}
          </p>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {step === 'mobile' ? (
              <>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: c.txt2 }}>
                  Mobile Number
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7 }}>
                    <span style={{ padding: '13px 14px', borderRadius: 11, border: `1px solid ${c.bdr}`, background: c.bgAlt, color: c.txt, fontSize: 15, fontWeight: 600 }}>+91</span>
                    <input
                      className="vtn-num"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                      placeholder="98XXX XXXXX"
                      inputMode="numeric"
                      autoFocus
                      style={field}
                    />
                  </div>
                </label>
                <button onClick={sendOtp} disabled={busy} style={cta(c.pri, busy)}>
                  {busy ? <Loader2 size={16} className="vtn-spin" /> : null}Send OTP <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: c.txt2 }}>
                  One-Time Password
                  <input
                    className="vtn-num"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && verify()}
                    placeholder="● ● ● ● ● ●"
                    inputMode="numeric"
                    autoFocus
                    style={{ ...field, marginTop: 7, letterSpacing: 8, fontSize: 20, fontWeight: 700, textAlign: 'center' }}
                  />
                </label>
                <button onClick={verify} disabled={busy} style={cta(c.pri, busy)}>
                  {busy ? <Loader2 size={16} className="vtn-spin" /> : null}Verify &amp; Continue <ArrowRight size={16} />
                </button>
                <button onClick={() => { setStep('mobile'); setOtp(''); setError('') }} style={{ background: 'none', border: 'none', color: c.pri, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Change mobile number
                </button>
              </>
            )}

            {error && (
              <p role="alert" style={{ fontSize: 12.5, color: c.err, background: `${c.err}0F`, border: `1px solid ${c.err}2E`, borderRadius: 10, padding: '10px 13px' }}>{error}</p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 32, paddingTop: 20, borderTop: `1px solid ${c.bdr}` }}>
            <ShieldCheck size={15} color={c.ok} />
            <p style={{ fontSize: 11.5, color: c.txt3, lineHeight: 1.55 }}>
              Your session is encrypted. Vetri never stores your Aadhaar number or OTP.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const cta = (pri: string, busy: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '14px 20px', borderRadius: 11, border: 'none', background: pri, color: '#fff',
  fontSize: 14.5, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.75 : 1, fontFamily: 'inherit',
})

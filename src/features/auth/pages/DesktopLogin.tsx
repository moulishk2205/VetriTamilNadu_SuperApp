import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { WORDMARK_CSS } from '@/components/brand/VetriWordmark'
import { FieldError, LoginHead, LoginPoster, TrustLine } from '../components/LoginParts'
import { useLoginCopy, useResendTimer } from '../hooks/useLoginUi'
import { LOGIN_CSS } from '../loginCss'
import { keepMobileCaret, showMobile, toMobile, type LoginError } from '../loginCopy'

/**
 * Sign-in for the Government Web Portal: the banner poster on the left, a quiet
 * form on the right — one question per step (the number, then the code).
 *
 * It performs the SAME OTP round-trip as the phone sign-in (`requestOtp` →
 * `login`) — no duplicated auth logic.
 */
export default function DesktopLogin({ onDone }: { onDone: () => void }) {
  const { login, requestOtp } = useAuth()
  const { lang, copy, toggleLang, anim } = useLoginCopy()
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  // Kept as a key, not a sentence, so it follows the language switch.
  const [error, setError] = useState<LoginError | ''>('')
  const [resent, setResent] = useState(false)
  const resend = useResendTimer()

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (mobile.length !== 10) return setError('mobileInvalid')
    setError(''); setBusy(true)
    try {
      await requestOtp(mobile, 'otp')
      setResent(false); resend.start(); setStep('otp')
    } catch {
      setError('sendFailed')
    } finally { setBusy(false) }
  }

  const sendAgain = async () => {
    if (busy || resend.left > 0) return
    setError(''); setResent(false); setBusy(true)
    try {
      await requestOtp(mobile, 'otp')
      // The earlier code is dead now; clear it and put the cursor where the new one goes.
      setOtp(''); setResent(true); resend.start()
      document.getElementById('vl-otp')?.focus()
    } catch {
      setError('sendFailed')
    } finally { setBusy(false) }
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (otp.length !== 6) return setError('codeInvalid')
    setError(''); setBusy(true)
    try {
      await login({ method: 'otp', identifier: mobile, otp })
      onDone()
    } catch {
      setError('codeRejected')
    } finally { setBusy(false) }
  }

  const changeNumber = () => { setStep('mobile'); setOtp(''); setError(''); setResent(false) }

  return (
    <div className={`vl${anim ? ' vl--anim' : ''}`} lang={lang}>
      <style>{WORDMARK_CSS}{LOGIN_CSS}</style>
      <LoginHead copy={copy} onToggleLang={toggleLang} />

      <div className="vl-stage">
        <LoginPoster copy={copy} sizes="(max-width: 980px) 300px, 70vh" />

        <main className="vl-side">
          <div className="vl-card">
            {step === 'mobile' ? (
              <form className="vl-step" key="mobile" onSubmit={sendOtp} noValidate>
                <h1 className="vl-h1">{copy.signIn}</h1>
                <p className="vl-lede">{copy.ledeMobile}</p>

                <label className="vl-lab" htmlFor="vl-mobile">{copy.mobileLabel}</label>
                <div className="vl-field" data-invalid={error === 'mobileInvalid'}>
                  <span className="vl-pre" id="vl-mobile-cc" aria-hidden="true">+91</span>
                  <input
                    id="vl-mobile"
                    className="vl-in"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={showMobile(mobile)}
                    onChange={(e) => { keepMobileCaret(e.target); setMobile(toMobile(e.target.value)); setError('') }}
                    aria-invalid={error === 'mobileInvalid'}
                    aria-describedby={error ? 'vl-mobile-err vl-mobile-cc vl-mobile-hint' : 'vl-mobile-cc vl-mobile-hint'}
                    autoFocus
                  />
                </div>
                {error
                  ? <FieldError id="vl-mobile-err">{copy.errors[error]}</FieldError>
                  : null}
                <p className="vl-hint" id="vl-mobile-hint">{copy.mobileHint}</p>

                <button type="submit" className="vl-cta" aria-busy={busy}>
                  {copy.send}
                  {busy ? <LoaderCircle size={19} className="vl-spin" aria-hidden="true" /> : <ArrowRight size={19} strokeWidth={2.2} aria-hidden="true" />}
                </button>
              </form>
            ) : (
              <form className="vl-step" key="otp" onSubmit={verify} noValidate>
                <button type="button" className="vl-link vl-back" onClick={changeNumber}>
                  <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />{copy.changeNumber}
                </button>
                <h1 className="vl-h1">{copy.enterCode}</h1>
                <p className="vl-lede" id="vl-otp-sent">{copy.sentTo[0]}<b>+91 {showMobile(mobile)}</b>{copy.sentTo[1]}</p>

                <label className="vl-lab" htmlFor="vl-otp">{copy.codeLabel}</label>
                <div className="vl-field" data-invalid={error === 'codeInvalid' || error === 'codeRejected'}>
                  <input
                    id="vl-otp"
                    className="vl-in vl-in--code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    aria-invalid={error === 'codeInvalid' || error === 'codeRejected'}
                    aria-describedby={error ? 'vl-otp-err vl-otp-sent' : 'vl-otp-sent'}
                    autoFocus
                  />
                </div>
                {error
                  ? <FieldError id="vl-otp-err">{copy.errors[error]}</FieldError>
                  : null}

                <button type="submit" className="vl-cta" aria-busy={busy}>
                  {copy.verify}
                  {busy ? <LoaderCircle size={19} className="vl-spin" aria-hidden="true" /> : null}
                </button>

                <p className="vl-resend">
                  <span role="status">{resent && resend.left > 0 ? `${copy.sentAgain} ` : ''}</span>
                  {resent && resend.left > 0 ? null : <>{copy.notReceived} </>}
                  {resend.left > 0
                    ? copy.sendNewIn(resend.label)
                    : <button type="button" className="vl-link" onClick={sendAgain}>{copy.sendNew}</button>}
                </p>
              </form>
            )}

            <TrustLine copy={copy} />
          </div>
        </main>
      </div>

      <footer className="vl-band">
        <span>{copy.band}</span>
        <span>{copy.rights(new Date().getFullYear())}</span>
      </footer>
    </div>
  )
}

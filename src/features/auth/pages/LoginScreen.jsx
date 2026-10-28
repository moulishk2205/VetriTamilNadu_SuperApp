import { useState } from "react";
import { ArrowLeft, ArrowRight, Fingerprint, LoaderCircle, ScanFace } from "lucide-react";
import { StatusBar } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { WORDMARK_CSS } from "@/components/brand/VetriWordmark";
import { FieldError, LoginHead, LoginPoster, TrustLine } from "../components/LoginParts";
import { useLoginCopy, useResendTimer } from "../hooks/useLoginUi";
import { LOGIN_CSS } from "../loginCss";
import { keepMobileCaret, showMobile, toMobile } from "../loginCopy";
import { DemoOtpHint } from "../components/DemoOtpHint";

// Phone sign-in: the banner poster on top, the form as a sheet rising over it.
// Same three ways in as before (mobile OTP, Aadhaar OTP, biometric) and the same
// requestOtp → login round-trip; `step` is 0 = ask, 1 = enter the code, 2 = verifying.
const LoginScreen = ({ onDone }) => {
  const { login, requestOtp } = useAuth();
  const { lang, copy, toggleLang, anim } = useLoginCopy();
  const [method, setMethod] = useState("otp");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0);
  // Error keys rather than sentences, so they follow the language switch.
  const [err, setErr] = useState("");
  const [otpErr, setOtpErr] = useState("");
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);
  const resend = useResendTimer();

  const aadhaarDigits = aadhaar.replace(/\s/g, "");
  const identifier = method === "otp" ? phone : aadhaarDigits;

  const reset = (id) => { setMethod(id); setPhone(""); setAadhaar(""); setOtp(""); setStep(0); setErr(""); setOtpErr(""); setResent(false); };
  const sendOTP = (e) => {
    e.preventDefault();
    if (phone.length < 10) { setErr("mobileInvalid"); return; }
    setErr(""); setOtpErr(""); requestOtp(phone, "otp").catch(() => {}); setResent(false); resend.start(); setStep(1);
  };
  const sendAadhaar = (e) => {
    e.preventDefault();
    if (aadhaarDigits.length < 12) { setErr("aadhaarInvalid"); return; }
    setErr(""); setOtpErr(""); requestOtp(aadhaarDigits, "aadhaar").catch(() => {}); setResent(false); resend.start(); setStep(1);
  };
  const sendAgain = () => {
    if (sending || resend.left > 0) return;
    // Focus moves inside the tap so the keyboard opens; the link it came from is about to be replaced.
    document.getElementById("vl-otp")?.focus();
    setOtpErr(""); setResent(false); setSending(true);
    requestOtp(identifier, method)
      .then(() => { setOtp(""); setResent(true); resend.start(); })
      .catch(() => setOtpErr("sendFailed"))
      .finally(() => setSending(false));
  };
  const verify = (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpErr("codeInvalid"); return; }
    setOtpErr(""); setStep(2);
    login({ method, identifier, otp }).then(() => onDone()).catch(() => { setStep(1); setOtpErr("codeRejected"); });
  };
  const biometric = () => {
    setErr(""); setStep(2);
    login({ method: "biometric" }).then(() => onDone()).catch(() => { setStep(0); setErr("bioFailed"); });
  };
  const changeIdentifier = () => { setStep(0); setOtp(""); setOtpErr(""); setResent(false); };

  const methods = [
    { id: "otp", l: copy.methodOtp },
    { id: "aadhaar", l: copy.methodAadhaar },
    { id: "biometric", l: copy.methodBiometric },
  ];

  return (
    <div className={`vl vl--phone${anim ? " vl--anim" : ""}`} lang={lang}>
      <style>{WORDMARK_CSS}{LOGIN_CSS}</style>
      <div className="vl-status"><StatusBar /></div>
      <LoginHead copy={copy} onToggleLang={toggleLang} sealSize={36} />
      <LoginPoster copy={copy} sizes="290px" />

      <main className="vl-sheet">
        {step === 0 && (
          <div className="vl-step" key="ask">
            <h1 className="vl-h1">{copy.signIn}</h1>
            <p className="vl-lede">{method === "aadhaar" ? copy.ledeAadhaar : method === "biometric" ? copy.bioLede : copy.ledeShort}</p>

            <div className="vl-seg" role="group" aria-label={copy.methodsLabel}>
              {methods.map((m) => (
                <button key={m.id} type="button" aria-pressed={method === m.id} onClick={() => reset(m.id)}>{m.l}</button>
              ))}
            </div>

            {method === "otp" && (
              <form className="vl-step" key="otp" onSubmit={sendOTP} noValidate>
                <label className="vl-lab" htmlFor="vl-mobile">{copy.mobileLabel}</label>
                <div className="vl-field" data-invalid={!!err}>
                  <span className="vl-pre" id="vl-mobile-cc" aria-hidden="true">+91</span>
                  <input id="vl-mobile" className="vl-in" type="tel" inputMode="numeric" autoComplete="tel-national" value={showMobile(phone)} onChange={(e) => { keepMobileCaret(e.target); setPhone(toMobile(e.target.value)); setErr(""); }} aria-invalid={!!err} aria-describedby={err ? "vl-mobile-err vl-mobile-cc" : "vl-mobile-cc"} />
                </div>
                {err ? <FieldError id="vl-mobile-err">{copy.errors[err]}</FieldError> : null}
                <button type="submit" className="vl-cta">{copy.send}<ArrowRight size={19} strokeWidth={2.2} aria-hidden="true" /></button>
              </form>
            )}

            {method === "aadhaar" && (
              <form className="vl-step" key="aadhaar" onSubmit={sendAadhaar} noValidate>
                <label className="vl-lab" htmlFor="vl-aadhaar">{copy.aadhaarLabel}</label>
                <div className="vl-field" data-invalid={!!err}>
                  <input id="vl-aadhaar" className="vl-in" type="text" inputMode="numeric" autoComplete="off" value={aadhaar} onChange={(e) => { const r = e.target.value.replace(/\D/g, "").slice(0, 12); setAadhaar(r.replace(/(\d{4})(?=\d)/g, "$1 ")); setErr(""); }} aria-invalid={!!err} aria-describedby={err ? "vl-aadhaar-err" : undefined} />
                </div>
                {err ? <FieldError id="vl-aadhaar-err">{copy.errors[err]}</FieldError> : null}
                <button type="submit" className="vl-cta">{copy.send}<ArrowRight size={19} strokeWidth={2.2} aria-hidden="true" /></button>
              </form>
            )}

            {method === "biometric" && (
              <div className="vl-bio vl-step" key="biometric">
                <div className="vl-bio-ico" aria-hidden="true"><ScanFace size={44} strokeWidth={1.5} /></div>
                <p className="vl-bio-t">{copy.bioTitle}</p>
                {err ? <FieldError id="vl-bio-err">{copy.errors[err]}</FieldError> : null}
                <button type="button" className="vl-cta" onClick={biometric}><Fingerprint size={19} strokeWidth={2.2} aria-hidden="true" />{copy.authenticate}</button>
                <button type="button" className="vl-link" onClick={() => reset("otp")}>{copy.useCode}</button>
              </div>
            )}
          </div>
        )}

        {(method === "otp" || method === "aadhaar") && step === 1 && (
          <form className="vl-step" key="code" onSubmit={verify} noValidate>
            <button type="button" className="vl-link vl-back" onClick={changeIdentifier}>
              <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />{method === "otp" ? copy.changeNumber : copy.changeAadhaar}
            </button>
            <h1 className="vl-h1">{copy.enterCode}</h1>
            <p className="vl-lede" id="vl-otp-sent">
              {method === "otp" ? <>{copy.sentTo[0]}<b>+91 {showMobile(phone)}</b>{copy.sentTo[1]}</> : copy.sentToAadhaar}
            </p>
            <DemoOtpHint />

            <label className="vl-lab" htmlFor="vl-otp">{copy.codeLabel}</label>
            <div className="vl-field" data-invalid={otpErr === "codeInvalid" || otpErr === "codeRejected"}>
              <input id="vl-otp" className="vl-in vl-in--code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpErr(""); }} aria-invalid={otpErr === "codeInvalid" || otpErr === "codeRejected"} aria-describedby={otpErr ? "vl-otp-err vl-otp-sent" : "vl-otp-sent"} autoFocus />
            </div>
            {otpErr ? <FieldError id="vl-otp-err">{copy.errors[otpErr]}</FieldError> : null}

            <button type="submit" className="vl-cta">{copy.verify}</button>
            <p className="vl-resend">
              <span role="status">{resent && resend.left > 0 ? `${copy.sentAgain} ` : ""}</span>
              {resent && resend.left > 0 ? null : <>{copy.notReceived} </>}
              {resend.left > 0 ? copy.sendNewIn(resend.label) : <button type="button" className="vl-link" onClick={sendAgain}>{copy.sendNew}</button>}
            </p>
          </form>
        )}

        {step === 2 && (
          <div className="vl-wait" role="status">
            <LoaderCircle size={44} strokeWidth={2} className="vl-spin" aria-hidden="true" />
            <p>{copy.signingIn}</p>
          </div>
        )}

        {step !== 2 && method !== "biometric" && <TrustLine copy={copy} />}
      </main>
    </div>
  );
};

export default LoginScreen;

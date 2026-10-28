import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, CheckCircle, Copy, Clock, Building2, IndianRupee, FileText, ShieldCheck, ArrowUpRight, Home, Timer, Save, BadgeCheck, Calendar } from 'lucide-react'
import { StatusBar, Header, Btn, Card, LIFT } from '@/components/ui'
import { AckStamp } from '@/components/feedback/AckStamp'
import { StepRail } from '@/components/feedback/StepRail'
import { presentTimeline } from '@/features/applications/timeline'
import { BOARD_STATE } from '@/features/home/useHomeBoard'
import { useApp, useC, useT } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getServiceMeta, getServiceForm } from '@/features/services/catalog'
import { FormRenderer } from '@/components/forms/FormRenderer'
import { DocumentUpload, type DocFileInfo, type WalletDocRef } from '@/components/forms/DocumentUpload'
import { useDocumentsQuery } from '@/features/documents/hooks/useDocuments'
import { validate, allFields } from '@/lib/forms/engine'
import type { FormValues } from '@/lib/forms/types'
import { useCreateApplication } from '@/features/applications/hooks/useApplications'
import { useDraftStore } from '@/store/draftStore'
import type { ApplicationDTO } from '@/features/applications/api/applicationsApi'

const STEPS = ['Overview', 'Eligibility', 'Documents', 'Application', 'Review']

const MODE_LABEL: Record<string, string> = { digital: 'Digital', assisted: 'Assisted', external: 'External' }

export default function ServiceFlow() {
  const { id = '' } = useParams()
  const c = useC()
  const t = useT()
  const { dark, anim } = useApp()
  const { onNav, goBack } = useAppNavigation()
  const { citizen } = useAuth()
  const meta = getServiceMeta(id)
  const form = getServiceForm(id)
  const createApp = useCreateApplication()
  const saveDraft = useDraftStore((s) => s.saveDraft)
  const getDraft = useDraftStore((s) => s.getDraft)
  const clearDraft = useDraftStore((s) => s.clearDraft)

  const [step, setStep] = useState(0)
  // Prefill once from a saved draft, else from the signed-in citizen's profile.
  const [values, setValues] = useState<FormValues>(() => {
    if (!form) return {}
    const draft = getDraft(form.id)
    if (draft && Object.keys(draft).length) return draft
    const addr = citizen?.addresses?.[0]
    return {
      fullName: citizen?.fullName ?? '',
      applicantName: citizen?.fullName ?? '',
      headName: citizen?.fullName ?? '',
      mobile: citizen?.mobile?.replace(/\D/g, '').slice(-10) ?? '',
      addressLine: addr?.line ?? '',
      district: addr?.district ?? '',
      taluk: addr?.area ?? '',
      pincode: addr?.pincode ?? '',
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<ApplicationDTO | null>(null)
  const [copied, setCopied] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [docFiles, setDocFiles] = useState<Record<string, DocFileInfo>>({})
  const { data: walletDocsRaw } = useDocumentsQuery()

  // Each step — and the acknowledgement — opens at the top of the screen.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step, submitted])

  if (!meta || !form) {
    return (
      <div style={{ minHeight: '100vh', padding: 24 }}>
        <StatusBar />
        <Header title="Service" onBack={goBack} />
        <p style={{ fontSize: 14, color: c.txt2, marginTop: 24 }}>This service is not available yet.</p>
      </div>
    )
  }

  const walletDocs: WalletDocRef[] = (walletDocsRaw ?? []).map((d) => ({ id: d.id, name: d.name, number: d.number, type: d.type }))
  const requiredDocs = form.documents.filter((d) => d.required)
  const docsComplete = requiredDocs.every((d) => docFiles[d.id])

  const setField = (fieldId: string, value: unknown) => {
    setValues((v) => ({ ...v, [fieldId]: value }))
    setErrors((e) => ({ ...e, [fieldId]: '' }))
    setDraftSaved(false)
  }
  const setDoc = (reqId: string, v: DocFileInfo | null) =>
    setDocFiles((prev) => {
      const next = { ...prev }
      if (v) next[reqId] = v
      else delete next[reqId]
      return next
    })

  const onSaveDraft = () => {
    saveDraft(form.id, values)
    setDraftSaved(true)
  }

  const goReview = () => {
    const result = validate(form, values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setStep(4)
  }

  const submit = () => {
    const documents = Object.entries(docFiles).map(([requirementId, f]) => ({ requirementId, name: f.name, source: f.source, walletDocId: f.walletDocId }))
    createApp.mutate(
      { serviceId: meta.id, fields: values, documents },
      {
        onSuccess: (app) => {
          clearDraft(form.id)
          setSubmitted(app)
        },
      },
    )
  }

  // ── Acknowledgement: the receipt a counter would hand over, stamped ─────────
  if (submitted) {
    const line = presentTimeline(submitted)
    const at = Math.max(line.findIndex((r) => r.status === 'current'), 0)
    const next = line.find((r) => r.status === 'pending')?.label
    const filed = new Date(submitted.createdAt)
    const copyRef = () => {
      void navigator.clipboard?.writeText(submitted.referenceNo).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600) }, () => {})
    }
    const rows: [string, string][] = [
      ['Service', submitted.serviceName],
      ['Department', submitted.department],
      ['Filed on', filed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
      ['Status', submitted.status],
    ]
    return (
      <div style={{ minHeight: '100vh', padding: '0 20px 32px' }}>
        <StatusBar />
        <div style={{ paddingTop: 30 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: c.txt, lineHeight: 1.12, maxWidth: 230 }}>{t('Application submitted')}</h1>
          <p style={{ fontSize: 13.5, color: c.txt2, marginTop: 8, lineHeight: 1.5, maxWidth: 250 }}>Received by {submitted.department}. Keep this reference to follow it.</p>
        </div>

        <div style={{ position: 'relative', marginTop: 22 }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, background: c.card, border: `1px solid ${dark ? c.bdr : 'transparent'}`, boxShadow: dark ? 'none' : LIFT }}>
            <div style={{ padding: '18px 18px 16px' }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.txt3 }}>{t('Reference number')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <p className="v-num" style={{ fontSize: 21, fontWeight: 700, color: c.pri, letterSpacing: '0.02em', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', overflowWrap: 'anywhere' }}>{submitted.referenceNo}</p>
                <button onClick={copyRef} aria-label={copied ? t('Copied') : `${t('Copy')} ${submitted.referenceNo}`} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, border: `1px solid ${c.bdr}`, background: c.bgAlt, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {copied ? <Check size={16} color={c.ok} /> : <Copy size={15} color={c.txt2} />}
                </button>
              </div>
              <p role="status" style={{ fontSize: 11, color: c.ok, fontWeight: 600, minHeight: 15, marginTop: 2 }}>{copied ? t('Copied') : ''}</p>
              <dl style={{ marginTop: 4 }}>
                {rows.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0' }}>
                    <dt style={{ fontSize: 12.5, color: c.txt2 }}>{k}</dt>
                    <dd className="v-num" style={{ fontSize: 12.5, fontWeight: 600, color: c.txt, textAlign: 'right' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {/* Tear line: two notches and a hairline, the shape of a counter receipt. */}
            <div aria-hidden="true" style={{ position: 'relative', height: 20 }}>
              <span style={{ position: 'absolute', left: -10, top: 0, width: 20, height: 20, borderRadius: 10, background: 'var(--vm-page)', boxShadow: `inset 0 0 0 1px ${dark ? c.bdr : 'rgba(90,60,0,.09)'}` }} />
              <span style={{ position: 'absolute', right: -10, top: 0, width: 20, height: 20, borderRadius: 10, background: 'var(--vm-page)', boxShadow: `inset 0 0 0 1px ${dark ? c.bdr : 'rgba(90,60,0,.09)'}` }} />
              <span style={{ position: 'absolute', left: 18, right: 18, top: 9.5, height: 1, background: c.bdr }} />
            </div>
            <div style={{ padding: '10px 18px 18px' }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: c.txt }}>{t('What happens next')}</p>
              <StepRail steps={line.length} step={at + 1} colour={BOARD_STATE.progress.dot} track={c.bdr} style={{ marginTop: 10 }} />
              <p className="v-num" style={{ fontSize: 12, color: c.txt2, marginTop: 8, lineHeight: 1.5 }}>
                Step {at + 1} of {line.length}{next ? <> · next, <b style={{ color: c.txt, fontWeight: 600 }}>{next}</b></> : null}
                {submitted.slaDaysRemaining != null && <><br />A decision is due within {submitted.slaDaysRemaining} {submitted.slaDaysRemaining === 1 ? 'day' : 'days'}, by law.</>}
              </p>
            </div>
          </div>
          <div style={{ position: 'absolute', top: -98, right: -2, pointerEvents: 'none' }}>
            <AckStamp date={filed} size={108} ink={dark ? '#F0705F' : '#8A1C15'} className={anim ? 'v-stamp' : ''} />
          </div>
        </div>

        {meta.mode !== 'digital' && meta.externalUrl && (
          <Card style={{ width: '100%', marginTop: 12, background: `${c.info}06`, border: `1px solid ${c.info}15` }}>
            <p style={{ fontSize: 12, color: c.txt2, lineHeight: 1.5 }}>
              This service is completed on <strong>{meta.externalName}</strong>. Your details are saved — continue there to finish.
            </p>
            <Btn variant="secondary" size="sm" style={{ marginTop: 10 }} icon={ArrowUpRight} onClick={() => window.open(meta.externalUrl, '_blank', 'noopener')}>
              Continue on {meta.externalName}
            </Btn>
          </Card>
        )}
        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 24 }}>
          <Btn variant="outline" onClick={() => onNav('tracker')} style={{ flex: 1 }} icon={Timer}>Track</Btn>
          <Btn variant="primary" onClick={() => onNav('home')} style={{ flex: 1 }} icon={Home}>{t('Home')}</Btn>
        </div>
      </div>
    )
  }

  const metaRows = [
    { icon: Building2, label: 'Department', value: meta.subDepartment ? `${meta.department} · ${meta.subDepartment}` : meta.department },
    { icon: Clock, label: 'Processing Time', value: meta.processingTime },
    { icon: IndianRupee, label: 'Official Fee', value: `${meta.fee} (Govt ${meta.govFee} + ${meta.serviceCharge})` },
    { icon: BadgeCheck, label: 'Validity', value: meta.certificateValidity },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <StatusBar />
      <div style={{ padding: '8px 20px' }}>
        <Header title={meta.name} onBack={step > 0 ? () => setStep(step - 1) : goBack} />

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i <= step ? c.pri : c.bdr }} />
              <p style={{ fontSize: 8, color: i <= step ? c.pri : c.txt3, marginTop: 4, textAlign: 'center', fontWeight: i === step ? 600 : 400 }}>{s}</p>
            </div>
          ))}
        </div>

        {/* Step 0 — Overview */}
        {step === 0 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: meta.mode === 'digital' ? c.ok : c.warn, background: meta.mode === 'digital' ? `${c.ok}15` : `${c.warn}15`, padding: '4px 10px', borderRadius: 9999, marginBottom: 12 }}>{MODE_LABEL[meta.mode]}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: c.txt2, marginBottom: 16 }}>{meta.description}</p>
            <Card style={{ padding: 0, marginBottom: 16 }}>
              {metaRows.map((r, i) => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < metaRows.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                  <r.icon size={18} color={c.pri} />
                  <span style={{ flex: 1, fontSize: 12, color: c.txt2 }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.txt, textAlign: 'right', maxWidth: 200 }}>{r.value}</span>
                </div>
              ))}
            </Card>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {meta.digitalFeatures.map((feat) => (
                <span key={feat} style={{ fontSize: 10, fontWeight: 600, color: c.pri, background: `${c.pri}0D`, padding: '5px 10px', borderRadius: 9999 }}>{feat}</span>
              ))}
            </div>
            {meta.appointmentRequired && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: `${c.warn}0D`, borderRadius: 10, marginBottom: 12 }}>
                <Calendar size={16} color={c.warn} />
                <span style={{ fontSize: 12, color: c.txt2 }}>An in-person appointment is required to complete this service.</span>
              </div>
            )}
            <p style={{ fontSize: 11, color: c.txt2, marginBottom: 4 }}><strong style={{ color: c.txt }}>Legal basis:</strong> {meta.legalBasis}</p>
            <p style={{ fontSize: 11, color: c.txt2, marginBottom: 4 }}><strong style={{ color: c.txt }}>Appeal:</strong> {meta.appealWorkflow}</p>
            <p style={{ fontSize: 10, color: c.txt3, margin: '10px 0 16px' }}>Source: {meta.sourceNote}</p>
            <Btn full variant="primary" size="lg" onClick={() => setStep(1)}>Check Eligibility</Btn>
          </div>
        )}

        {/* Step 1 — Eligibility */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 12 }}>Eligibility</p>
            {meta.eligibility.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <ShieldCheck size={18} color={c.ok} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: c.txt, lineHeight: 1.5 }}>{e}</span>
              </div>
            ))}
            <Btn full variant="primary" size="lg" style={{ marginTop: 12 }} onClick={() => setStep(2)}>I Meet These — Continue</Btn>
          </div>
        )}

        {/* Step 2 — Required documents (upload / pick from Wallet) */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 4 }}>Required Documents</p>
            <p style={{ fontSize: 12, color: c.txt2, marginBottom: 14 }}>
              {Object.keys(docFiles).length}/{form.documents.length} attached · {requiredDocs.length} required
            </p>
            {form.documents.map((d) => (
              <Card key={d.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <FileText size={18} color={c.pri} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>{d.label}</p>
                    <p style={{ fontSize: 11, color: c.txt2 }}>{d.required ? 'Required' : 'Optional'}{d.appliesWhen ? ` · ${d.appliesWhen}` : ''}</p>
                  </div>
                  {d.required && !docFiles[d.id] && <span style={{ fontSize: 9, fontWeight: 700, color: c.err, background: `${c.err}12`, padding: '3px 8px', borderRadius: 9999 }}>PENDING</span>}
                </div>
                <DocumentUpload requirement={d} value={docFiles[d.id] ?? null} onChange={(v) => setDoc(d.id, v)} walletDocs={walletDocs} />
              </Card>
            ))}
            {!docsComplete && <p style={{ fontSize: 11, color: c.txt3, textAlign: 'center', marginBottom: 8 }}>Attach every required document to continue</p>}
            <Btn full variant="primary" size="lg" style={{ marginTop: 4 }} onClick={() => setStep(3)} disabled={!docsComplete}>Start Application</Btn>
          </div>
        )}

        {/* Step 3 — Application form */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <FormRenderer def={form} values={values} errors={errors} onChange={setField} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {form.allowDraft && (
                <Btn variant="outline" onClick={onSaveDraft} style={{ flex: 1 }} icon={Save}>{draftSaved ? 'Saved' : 'Save Draft'}</Btn>
              )}
              <Btn variant="primary" onClick={goReview} style={{ flex: 1 }}>Review</Btn>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 12 }}>Review &amp; Submit</p>
            <Card style={{ marginBottom: 16 }}>
              {allFields(form).filter((f) => values[f.id] !== undefined && values[f.id] !== '').map((f) => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: c.txt2 }}>{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.txt, textAlign: 'right' }}>{String(values[f.id])}</span>
                </div>
              ))}
            </Card>
            <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Attached Documents</p>
            <Card style={{ marginBottom: 16, padding: 0 }}>
              {form.documents.filter((d) => docFiles[d.id]).map((d, i, arr) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                  <FileText size={16} color={c.pri} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: c.txt }}>{d.label}</p>
                    <p style={{ fontSize: 11, color: c.txt2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{docFiles[d.id].name}{docFiles[d.id].source === 'wallet' ? ' · from Wallet' : ''}</p>
                  </div>
                  <CheckCircle size={14} color={c.ok} />
                </div>
              ))}
            </Card>
            <Btn full variant="gold" size="lg" onClick={submit} disabled={createApp.isPending}>
              {createApp.isPending ? 'Submitting…' : 'Submit Application'}
            </Btn>
            {createApp.isError && <p style={{ fontSize: 12, color: c.err, marginTop: 8, textAlign: 'center' }}>Could not submit. Please try again.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

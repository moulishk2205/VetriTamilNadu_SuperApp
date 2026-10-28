import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  ChevronRight, Check, Clock, Building2, IndianRupee, BadgeCheck, ShieldCheck, FileText, Calendar,
  ArrowLeft, ArrowRight, Save, Send, CheckCircle2, AlertTriangle, Download, Printer, Share2, Timer,
  ExternalLink, LifeBuoy, Phone, Landmark, Pencil, CreditCard, Banknote, Copy,
} from 'lucide-react'
import { useApp, useC } from '@/hooks/useUi'
import { AckStamp } from '@/components/feedback/AckStamp'
import { StepRail } from '@/components/feedback/StepRail'
import { presentTimeline } from '@/features/applications/timeline'
import { BOARD_STATE } from '@/features/home/useHomeBoard'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getServiceMeta, getServiceForm } from '@/features/services/catalog'
import { DesktopFormRenderer } from '@/components/forms/DesktopFormRenderer'
import { DesktopDocumentUpload } from '@/components/forms/DesktopDocumentUpload'
import type { DocFileInfo, WalletDocRef } from '@/components/forms/DocumentUpload'
import { useDocumentsQuery } from '@/features/documents/hooks/useDocuments'
import { validate, allFields } from '@/lib/forms/engine'
import type { FormValues } from '@/lib/forms/types'
import { useCreateApplication } from '@/features/applications/hooks/useApplications'
import { useDraftStore } from '@/store/draftStore'
import type { ApplicationDTO } from '@/features/applications/api/applicationsApi'
import { Panel, StatusChip, EmptyState, DeskBtn } from '@/app/desktop/DesktopUI'

const MODE_LABEL: Record<string, string> = { digital: 'Digital', assisted: 'Assisted', external: 'External' }
const isFree = (fee: string) => /free|^₹?0$|nil/i.test(fee.trim())

/**
 * Desktop service journey.
 *
 * The SAME business logic as the mobile `ServiceFlow` — identical prefill,
 * Form Engine validation, document rules, draft store and `useCreateApplication`
 * mutation — presented as a government desktop workflow: breadcrumb, horizontal
 * stepper, two-column working area + service information rail, and a sticky
 * action bar. No mobile screen ever appears in the Website Experience.
 */
export default function DesktopServiceFlow() {
  const { id = '' } = useParams()
  const c = useC()
  const { dark, anim } = useApp()
  const { onNav } = useAppNavigation()
  const { citizen } = useAuth()
  const meta = getServiceMeta(id)
  const form = getServiceForm(id)
  const createApp = useCreateApplication()
  const saveDraft = useDraftStore((s) => s.saveDraft)
  const getDraft = useDraftStore((s) => s.getDraft)
  const clearDraft = useDraftStore((s) => s.clearDraft)
  const { data: walletDocsRaw } = useDocumentsQuery()

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
  const [draftSaved, setDraftSaved] = useState(false)
  const [docFiles, setDocFiles] = useState<Record<string, DocFileInfo>>({})
  const [payMethod, setPayMethod] = useState('upi')
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  const feePayable = meta ? !isFree(meta.fee) : false
  // Payment only exists as a step when a fee is actually payable.
  const steps = useMemo(
    () => ['Overview', 'Eligibility', 'Documents', 'Application', 'Review', ...(feePayable ? ['Payment'] : []), 'Submit'],
    [feePayable],
  )
  const submitStep = steps.length - 1

  // Each step — and the acknowledgement — opens at the top of the page rather
  // than at the scroll offset of the step the citizen just left.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step, submitted])

  // Real, scannable QR for the acknowledgement (encodes the reference number).
  useEffect(() => {
    if (!submitted) return
    QRCode.toDataURL(`VETRI-TN|${submitted.referenceNo}|${submitted.serviceName}`, { width: 320, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''))
  }, [submitted])

  if (!meta || !form) {
    return (
      <div className="vtn-card">
        <EmptyState
          title="This service is not available yet"
          desc="The service catalogue does not contain a workflow for this identifier. Browse the catalogue for services you can apply for today."
          action={<DeskBtn variant="primary" onClick={() => onNav('services')}>Back to services</DeskBtn>}
        />
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

  /** Application step → Review: gate on the Form Engine's validation. */
  const goFromForm = () => {
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

  const filledFields = allFields(form).filter((f) => values[f.id] !== undefined && values[f.id] !== '')

  /** Acknowledgement download — a real file built from the submitted application. */
  const downloadAck = (app: ApplicationDTO) => {
    const lines = [
      'GOVERNMENT OF TAMIL NADU — VETRI e-SEVAI',
      'APPLICATION ACKNOWLEDGEMENT',
      '',
      `Reference number : ${app.referenceNo}`,
      `Service          : ${app.serviceName}`,
      `Department       : ${app.department}`,
      `Status           : ${app.status}`,
      `Filed on         : ${new Date(app.createdAt).toLocaleString('en-IN')}`,
      `Applicant        : ${citizen?.fullName ?? '—'}`,
      `Citizen ID       : ${citizen?.citizenId ?? '—'}`,
      '',
      'Submitted details',
      ...filledFields.map((f) => `  ${f.label}: ${String(values[f.id])}`),
      '',
      'Attached documents',
      ...form.documents.filter((d) => docFiles[d.id]).map((d) => `  ${d.label}: ${docFiles[d.id].name}`),
      '',
      `Processing time  : ${meta.processingTime}`,
      `Official fee     : ${meta.fee}`,
      '',
      'Track this application in the Vetri portal under My Applications.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.referenceNo}-acknowledgement.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const share = async (app: ApplicationDTO) => {
    const text = `Vetri TN — ${app.serviceName} application ${app.referenceNo} (${app.status})`
    if (navigator.share) {
      try { await navigator.share({ title: 'Vetri TN application', text }) } catch { /* dismissed */ }
    } else {
      try { await navigator.clipboard.writeText(text) } catch { /* clipboard unavailable */ }
    }
  }

  // ══════════════ Acknowledgement ══════════════
  if (submitted) {
    return (
      <>
        <Breadcrumb items={[{ l: 'Home', k: 'home' }, { l: 'Services', k: 'services' }, { l: meta.name }, { l: 'Acknowledgement' }]} />

        <div className="vtn-split" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Panel>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18, minHeight: 112 }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 120 }}>
                  <h1 style={{ fontSize: 'clamp(24px, 2vw, 32px)', fontWeight: 700, color: c.txt, letterSpacing: '-0.03em', lineHeight: 1.12 }}>Application submitted</h1>
                  <p style={{ fontSize: 14, color: c.txt2, marginTop: 6, lineHeight: 1.55 }}>Received by {submitted.department}. Keep this reference to follow it, or scan the code at any counter.</p>
                </div>
                <div style={{ position: 'absolute', right: 0, top: -8 }}>
                  <AckStamp date={new Date(submitted.createdAt)} size={118} ink={dark ? '#F0705F' : '#8A1C15'} className={anim ? 'v-stamp' : ''} />
                </div>
              </div>

              <div style={{ marginTop: 18, padding: 20, borderRadius: 16, border: `1px solid ${c.bdr}`, background: c.bgAlt, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: c.txt3 }}>Reference number</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <p className="vtn-num" style={{ fontSize: 'clamp(19px, 1.6vw, 24px)', fontWeight: 700, color: c.pri, letterSpacing: '.02em', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace' }}>{submitted.referenceNo}</p>
                    <button
                      onClick={() => { void navigator.clipboard?.writeText(submitted.referenceNo).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600) }, () => {}) }}
                      aria-label={copied ? 'Copied' : `Copy ${submitted.referenceNo}`}
                      title={copied ? 'Copied' : 'Copy reference'}
                      style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${c.bdr}`, background: c.card, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {copied ? <Check size={16} color={c.ok} /> : <Copy size={15} color={c.txt2} />}
                    </button>
                    <span role="status" style={{ fontSize: 12, fontWeight: 600, color: c.ok }}>{copied ? 'Copied' : ''}</span>
                  </div>
                  <div style={{ marginTop: 12 }}><StatusChip label={submitted.status} tone="warn" /></div>
                  {(() => {
                    const line = presentTimeline(submitted)
                    const at = Math.max(line.findIndex((r) => r.status === 'current'), 0)
                    const next = line.find((r) => r.status === 'pending')?.label
                    return (
                      <div style={{ marginTop: 18, maxWidth: 420 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: c.txt }}>What happens next</p>
                        <StepRail steps={line.length} step={at + 1} colour={BOARD_STATE.progress.dot} track={c.bdr} style={{ marginTop: 9 }} />
                        <p className="vtn-num" style={{ fontSize: 12.5, color: c.txt2, marginTop: 8, lineHeight: 1.55 }}>
                          Step {at + 1} of {line.length}{next ? <> · next, <b style={{ color: c.txt, fontWeight: 600 }}>{next}</b></> : null}
                          {submitted.slaDaysRemaining != null && <>. A decision is due within {submitted.slaDaysRemaining} {submitted.slaDaysRemaining === 1 ? 'day' : 'days'}, by law.</>}
                        </p>
                      </div>
                    )
                  })()}
                </div>
                {qr && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={qr} alt={`QR code for application ${submitted.referenceNo}`} width={132} height={132} style={{ borderRadius: 10, border: `1px solid ${c.bdr}`, background: '#fff' }} />
                    <p style={{ fontSize: 10.5, color: c.txt3, marginTop: 7 }}>Scan to verify this reference</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
                <DeskBtn variant="primary" icon={Timer} onClick={() => onNav('tracker')}>Track application</DeskBtn>
                <DeskBtn icon={Download} onClick={() => downloadAck(submitted)}>Download acknowledgement</DeskBtn>
                <DeskBtn icon={Printer} onClick={() => window.print()}>Print</DeskBtn>
                <DeskBtn icon={Share2} onClick={() => void share(submitted)}>Share</DeskBtn>
              </div>

              {meta.mode !== 'digital' && meta.externalUrl && (
                <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: `${c.info}0A`, border: `1px solid ${c.info}26` }}>
                  <p style={{ fontSize: 13, color: c.txt2, lineHeight: 1.6 }}>
                    This service is completed on <strong style={{ color: c.txt }}>{meta.externalName}</strong>. Your details are saved — continue there to finish.
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <DeskBtn icon={ExternalLink} onClick={() => window.open(meta.externalUrl, '_blank', 'noopener')}>Continue on {meta.externalName}</DeskBtn>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Submitted details">
              <dl style={{ display: 'grid', gap: 0 }}>
                {filledFields.map((f, i, arr) => (
                  <div key={f.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                    <dt style={{ fontSize: 12.5, color: c.txt2 }}>{f.label}</dt>
                    <dd style={{ fontSize: 13.5, color: c.txt, fontWeight: 500 }}>{String(values[f.id])}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>

          <InfoRail meta={meta} form={form} docFiles={docFiles} onNav={onNav} />
        </div>
      </>
    )
  }

  // ══════════════ Journey ══════════════
  const canAdvance =
    step === 2 ? docsComplete : true

  const next = () => {
    if (step === 3) return goFromForm()
    if (step === submitStep) return submit()
    setStep((s) => Math.min(s + 1, submitStep))
  }

  const nextLabel =
    step === 3 ? 'Review application'
      : step === submitStep ? (createApp.isPending ? 'Submitting…' : 'Submit application')
        : step === 1 ? 'I meet these — continue'
          : 'Continue'

  return (
    <>
      <Breadcrumb items={[{ l: 'Home', k: 'home' }, { l: 'Services', k: 'services' }, { l: meta.name }, { l: steps[step] }]} />

      {/* Title + mode */}
      {meta.nameTamil && <p lang="ta" style={{ marginTop: 8, fontFamily: "'Noto Serif Tamil','Noto Sans Tamil',serif", fontWeight: 900, fontStretch: '80%', fontSize: 'clamp(17px, 1.35vw, 22px)', lineHeight: 1.25, color: dark ? '#FFC401' : c.pri }}>{meta.nameTamil}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: meta.nameTamil ? 0 : 6, marginBottom: 18 }}>
        <h1 style={{ fontSize: 'clamp(24px, 2.2vw, 34px)', fontWeight: 700, color: c.txt, letterSpacing: '-0.03em' }}>{meta.name}</h1>
        <StatusChip label={MODE_LABEL[meta.mode]} tone={meta.mode === 'digital' ? 'ok' : 'warn'} />
      </div>

      {/* Stepper */}
      <ol className="vtn-card" style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 4, listStyle: 'none', marginBottom: 24, borderRadius: 16, padding: '8px 8px 12px', overflow: 'hidden' }}>
        <li aria-hidden="true" style={{ position: 'absolute', left: 16, right: 16, bottom: 5, height: 3, borderRadius: 2, background: c.bdr }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: 2, background: c.pri, transformOrigin: 'left', transform: `scaleX(${steps.length > 1 ? step / (steps.length - 1) : 1})`, transition: 'transform 320ms var(--ease-io)' }} />
        </li>
        {steps.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={s} style={{ flex: '1 1 110px' }}>
              <button
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                aria-current={active ? 'step' : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 9,
                  border: 'none', background: active ? `${c.pri}0F` : 'transparent',
                  cursor: i <= step ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? c.ok : active ? c.pri : 'transparent', border: done || active ? 'none' : `1.5px solid ${c.bdr}`, color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {done ? <Check size={13} /> : <span className="vtn-num" style={{ color: active ? '#fff' : c.txt3 }}>{i + 1}</span>}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? c.pri : done ? c.txt : c.txt3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="vtn-split">
        {/* ── Working area ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {step === 0 && (
            <>
              <Panel title="About this service">
                <p style={{ fontSize: 14, lineHeight: 1.7, color: c.txt2 }}>{meta.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
                  {meta.digitalFeatures.map((f) => (
                    <span key={f} style={{ fontSize: 11.5, fontWeight: 600, color: c.pri, background: `${c.pri}0D`, padding: '6px 11px', borderRadius: 9999 }}>{f}</span>
                  ))}
                </div>
                {meta.appointmentRequired && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', background: `${c.warn}0D`, border: `1px solid ${c.warn}26`, borderRadius: 11, marginTop: 18 }}>
                    <Calendar size={17} color={c.warn} />
                    <span style={{ fontSize: 13, color: c.txt2 }}>An in-person appointment is required to complete this service.</span>
                  </div>
                )}
              </Panel>

              <Panel title="Legal basis &amp; appeal">
                <dl style={{ display: 'grid', gap: 14 }}>
                  {[
                    { icon: Landmark, k: 'Legal basis', v: meta.legalBasis },
                    { icon: ShieldCheck, k: 'Appeal process', v: meta.appealWorkflow },
                  ].map((r) => (
                    <div key={r.k} style={{ display: 'flex', gap: 12 }}>
                      <r.icon size={16} color={c.txt3} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <dt style={{ fontSize: 11.5, color: c.txt3 }}>{r.k}</dt>
                        <dd style={{ fontSize: 13, color: c.txt, marginTop: 3, lineHeight: 1.6 }}>{r.v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
                <p style={{ fontSize: 11, color: c.txt3, marginTop: 16, paddingTop: 13, borderTop: `1px solid ${c.bdr}` }}>Source: {meta.sourceNote}</p>
              </Panel>
            </>
          )}

          {step === 1 && (
            <Panel title="Eligibility criteria">
              <p style={{ fontSize: 13, color: c.txt2, marginBottom: 18 }}>Confirm that you meet every criterion below before continuing.</p>
              <ul style={{ listStyle: 'none', display: 'grid', gap: 14 }}>
                {meta.eligibility.map((e, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <ShieldCheck size={18} color={c.ok} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13.5, color: c.txt, lineHeight: 1.6 }}>{e}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {step === 2 && (
            <Panel title="Required documents" action={<span className="vtn-num" style={{ fontSize: 12, color: c.txt2 }}>{Object.keys(docFiles).length}/{form.documents.length} attached</span>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {form.documents.map((d) => (
                  <div key={d.id}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                      <FileText size={16} color={c.pri} />
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt }}>{d.label}</p>
                      {d.required
                        ? <StatusChip label={docFiles[d.id] ? 'Attached' : 'Required'} tone={docFiles[d.id] ? 'ok' : 'err'} />
                        : <StatusChip label="Optional" tone="neutral" />}
                      {d.appliesWhen && <span style={{ fontSize: 11.5, color: c.txt3 }}>· {d.appliesWhen}</span>}
                    </div>
                    <DesktopDocumentUpload requirement={d} value={docFiles[d.id] ?? null} onChange={(v) => setDoc(d.id, v)} walletDocs={walletDocs} />
                  </div>
                ))}
              </div>
              {!docsComplete && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: c.warn, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.bdr}` }}>
                  <AlertTriangle size={14} />Attach every required document to continue.
                </p>
              )}
            </Panel>
          )}

          {step === 3 && <DesktopFormRenderer def={form} values={values} errors={errors} onChange={setField} />}

          {step === 4 && (
            <>
              <Panel title="Review your details" action={<button onClick={() => setStep(3)} style={editBtn(c)}><Pencil size={12} />Edit</button>}>
                <dl style={{ display: 'grid', gap: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
                  {filledFields.map((f) => (
                    <div key={f.id} style={{ padding: '11px 0', borderBottom: `1px solid ${c.bdr}` }}>
                      <dt style={{ fontSize: 11.5, color: c.txt3 }}>{f.label}</dt>
                      <dd style={{ fontSize: 13.5, color: c.txt, fontWeight: 500, marginTop: 3 }}>{String(values[f.id])}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>

              <Panel title="Attached documents" action={<button onClick={() => setStep(2)} style={editBtn(c)}><Pencil size={12} />Edit</button>} padded={false}>
                {form.documents.filter((d) => docFiles[d.id]).map((d, i, arr) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                    <FileText size={16} color={c.pri} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>{d.label}</p>
                      <p style={{ fontSize: 11.5, color: c.txt2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {docFiles[d.id].name}{docFiles[d.id].source === 'wallet' ? ' · from wallet' : ''}
                      </p>
                    </div>
                    <CheckCircle2 size={15} color={c.ok} />
                  </div>
                ))}
                {Object.keys(docFiles).length === 0 && (
                  <p style={{ padding: 20, fontSize: 13, color: c.txt2 }}>No documents attached.</p>
                )}
              </Panel>
            </>
          )}

          {feePayable && step === 5 && (
            <>
              <Panel title="Fee summary">
                <dl style={{ display: 'grid', gap: 0 }}>
                  {[
                    { k: 'Government fee', v: meta.govFee },
                    { k: 'Service charge', v: meta.serviceCharge },
                    { k: 'Total payable', v: meta.fee, strong: true },
                  ].map((r) => (
                    <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: r.strong ? 'none' : `1px solid ${c.bdr}`, borderTop: r.strong ? `2px solid ${c.bdr}` : 'none' }}>
                      <dt style={{ fontSize: r.strong ? 14 : 13, color: r.strong ? c.txt : c.txt2, fontWeight: r.strong ? 700 : 400 }}>{r.k}</dt>
                      <dd className="vtn-num" style={{ fontSize: r.strong ? 16 : 13.5, color: r.strong ? c.pri : c.txt, fontWeight: r.strong ? 800 : 500 }}>{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>

              <Panel title="Payment method">
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
                  {[
                    { id: 'upi', label: 'UPI', desc: 'BHIM / GPay / PhonePe', icon: CreditCard },
                    { id: 'card', label: 'Debit / credit card', desc: 'Visa, RuPay, Mastercard', icon: CreditCard },
                    { id: 'counter', label: 'Pay at e-Sevai centre', desc: 'Cash at the counter', icon: Banknote },
                  ].map((m) => {
                    const on = payMethod === m.id
                    return (
                      <button key={m.id} onClick={() => setPayMethod(m.id)} aria-pressed={on}
                        style={{ textAlign: 'left', padding: 15, borderRadius: 12, border: `1px solid ${on ? c.pri : c.bdr}`, background: on ? `${c.pri}0A` : c.bg, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <m.icon size={18} color={on ? c.pri : c.txt3} />
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt, marginTop: 9 }}>{m.label}</p>
                        <p style={{ fontSize: 11.5, color: c.txt2, marginTop: 3 }}>{m.desc}</p>
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: 12, color: c.txt2, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.bdr}`, lineHeight: 1.6 }}>
                  The fee is collected by the department when your application is processed. Vetri records your chosen method with the
                  application; no card or UPI credentials are captured here.
                </p>
              </Panel>
            </>
          )}

          {step === submitStep && (
            <Panel title="Confirm submission">
              <p style={{ fontSize: 13.5, color: c.txt2, lineHeight: 1.7 }}>
                You are submitting an application for <strong style={{ color: c.txt }}>{meta.name}</strong> to {meta.department}.
                Processing takes <strong style={{ color: c.txt }}>{meta.processingTime}</strong> under the Right to Service charter.
              </p>
              <dl style={{ display: 'grid', gap: 0, marginTop: 18 }}>
                {[
                  { k: 'Details completed', v: `${filledFields.length} field${filledFields.length === 1 ? '' : 's'}` },
                  { k: 'Documents attached', v: `${Object.keys(docFiles).length} of ${form.documents.length}` },
                  ...(feePayable ? [{ k: 'Fee', v: `${meta.fee} · ${payMethod === 'counter' ? 'at e-Sevai centre' : payMethod.toUpperCase()}` }] : []),
                ].map((r, i, arr) => (
                  <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                    <dt style={{ fontSize: 13, color: c.txt2 }}>{r.k}</dt>
                    <dd className="vtn-num" style={{ fontSize: 13.5, color: c.txt, fontWeight: 600 }}>{r.v}</dd>
                  </div>
                ))}
              </dl>
              {createApp.isError && (
                <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: c.err, marginTop: 16, padding: '11px 14px', background: `${c.err}0A`, border: `1px solid ${c.err}2E`, borderRadius: 10 }}>
                  <AlertTriangle size={14} />Could not submit the application. Please try again.
                </p>
              )}
            </Panel>
          )}
        </div>

        {/* ── Service information rail ──────────────────────────────────── */}
        <InfoRail meta={meta} form={form} docFiles={docFiles} onNav={onNav} />
      </div>

      {/* ── Sticky action bar ──────────────────────────────────────────── */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: 24, padding: '14px 0', background: `var(--page, ${c.bgAlt})`, borderTop: `1px solid ${c.bdr}`, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', zIndex: 20 }}>
        <DeskBtn icon={ArrowLeft} onClick={() => (step === 0 ? onNav('services') : setStep(step - 1))}>
          {step === 0 ? 'Back to services' : 'Previous'}
        </DeskBtn>
        {form.allowDraft && step >= 3 && (
          <DeskBtn icon={Save} onClick={onSaveDraft}>{draftSaved ? 'Draft saved' : 'Save draft'}</DeskBtn>
        )}
        <span style={{ flex: 1 }} />
        <span className="vtn-num" style={{ fontSize: 12, color: c.txt3 }}>Step {step + 1} of {steps.length}</span>
        <button
          onClick={next}
          disabled={!canAdvance || createApp.isPending}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 11, border: 'none',
            background: step === submitStep ? c.sec : c.pri, color: step === submitStep ? '#3A2A05' : '#fff',
            fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            cursor: !canAdvance || createApp.isPending ? 'not-allowed' : 'pointer',
            opacity: !canAdvance || createApp.isPending ? 0.55 : 1,
          }}
        >
          {nextLabel}{step === submitStep ? <Send size={15} /> : <ArrowRight size={15} />}
        </button>
      </div>
    </>
  )
}

/** Breadcrumb trail — the citizen always knows where they are. */
function Breadcrumb({ items }: { items: { l: string; k?: string }[] }) {
  const c = useC()
  const { onNav } = useAppNavigation()
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 10 }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, listStyle: 'none' }}>
        {items.map((it, i) => (
          <li key={`${it.l}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {it.k ? (
              <button onClick={() => onNav(it.k as string)} style={{ background: 'none', border: 'none', padding: 0, color: c.pri, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{it.l}</button>
            ) : (
              <span style={{ fontSize: 12.5, color: i === items.length - 1 ? c.txt : c.txt2, fontWeight: i === items.length - 1 ? 600 : 400 }}>{it.l}</span>
            )}
            {i < items.length - 1 && <ChevronRight size={13} color={c.txt3} />}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Right-hand rail: service facts, document checklist and help — always in view. */
function InfoRail({
  meta,
  form,
  docFiles,
  onNav,
}: {
  meta: NonNullable<ReturnType<typeof getServiceMeta>>
  form: NonNullable<ReturnType<typeof getServiceForm>>
  docFiles: Record<string, DocFileInfo>
  onNav: (k: string) => void
}) {
  const c = useC()
  const rows = [
    { icon: Clock, k: 'Processing time', v: meta.processingTime },
    { icon: IndianRupee, k: 'Official fee', v: `${meta.fee} (Govt ${meta.govFee} + ${meta.serviceCharge})` },
    { icon: Building2, k: 'Department', v: meta.subDepartment ? `${meta.department} · ${meta.subDepartment}` : meta.department },
    { icon: BadgeCheck, k: 'Validity', v: meta.certificateValidity },
  ]

  return (
    <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel title="Service information">
        <dl style={{ display: 'grid', gap: 14 }}>
          {rows.map((r) => (
            <div key={r.k} style={{ display: 'flex', gap: 11 }}>
              <r.icon size={15} color={c.txt3} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <dt style={{ fontSize: 11, color: c.txt3 }}>{r.k}</dt>
                <dd style={{ fontSize: 12.5, color: c.txt, marginTop: 2, fontWeight: 500, lineHeight: 1.5 }}>{r.v}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Document checklist" padded={false}>
        {form.documents.map((d, i, arr) => {
          const attached = Boolean(docFiles[d.id])
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
              {attached ? <CheckCircle2 size={15} color={c.ok} /> : <span style={{ width: 15, height: 15, borderRadius: '50%', border: `1.5px solid ${d.required ? c.warn : c.bdr}`, flexShrink: 0 }} />}
              <span style={{ flex: 1, fontSize: 12.5, color: attached ? c.txt : c.txt2 }}>{d.label}</span>
              {d.required && !attached && <span style={{ fontSize: 10, fontWeight: 700, color: c.warn }}>REQ</span>}
            </div>
          )
        })}
      </Panel>

      <Panel title="Help &amp; support">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => onNav('help')} style={helpRow(c)}><LifeBuoy size={15} color={c.pri} />Citizen guide &amp; FAQs</button>
          <button onClick={() => onNav('ai')} style={helpRow(c)}><ShieldCheck size={15} color={c.pri} />Ask Vetri about this service</button>
          <button onClick={() => onNav('emergency')} style={helpRow(c)}><Phone size={15} color={c.pri} />Emergency contacts</button>
          {meta.portalUrl && (
            <button onClick={() => window.open(meta.portalUrl, '_blank', 'noopener')} style={helpRow(c)}>
              <ExternalLink size={15} color={c.pri} />Official portal
            </button>
          )}
        </div>
      </Panel>
    </div>
  )
}

const editBtn = (c: ReturnType<typeof useC>): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
  color: c.pri, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
})
const helpRow = (c: ReturnType<typeof useC>): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9,
  border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 12.5, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
})

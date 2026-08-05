import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Clock, Building2, IndianRupee, FileText, ShieldCheck, ArrowUpRight, Home, Timer, Save, BadgeCheck, Calendar } from 'lucide-react'
import { StatusBar, Header, Btn, Card } from '@/components/ui'
import { useC, useT } from '@/hooks/useUi'
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
  const [draftSaved, setDraftSaved] = useState(false)
  const [docFiles, setDocFiles] = useState<Record<string, DocFileInfo>>({})
  const { data: walletDocsRaw } = useDocumentsQuery()

  if (!meta || !form) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, padding: 24 }}>
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

  // ── Submitted success screen ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${c.ok}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'successPop 0.5s', marginBottom: 24 }}>
          <CheckCircle size={40} color={c.ok} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: c.txt, textAlign: 'center' }}>Application Submitted</h2>
        <Card style={{ width: '100%', marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: c.txt3, letterSpacing: 1, textTransform: 'uppercase' }}>Application ID</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: c.pri, marginTop: 4, fontFamily: 'monospace' }}>{submitted.referenceNo}</p>
          <div style={{ height: 1, background: c.bdr, margin: '16px 0' }} />
          {[['Service', submitted.serviceName], ['Department', submitted.department], ['Status', submitted.status]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: c.txt2 }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: c.txt }}>{v}</span>
            </div>
          ))}
        </Card>
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
    <div style={{ minHeight: '100vh', background: c.bg, paddingBottom: 40 }}>
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

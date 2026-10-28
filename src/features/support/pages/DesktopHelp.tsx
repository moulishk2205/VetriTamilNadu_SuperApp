import { useMemo, useState } from 'react'
import { ChevronDown, Phone, Mail, Building2, Sparkles, LifeBuoy, ShieldCheck } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Panel, Toolbar, EmptyState, DeskBtn } from '@/app/desktop/DesktopUI'

/** Citizen-charter FAQs. Answers reflect the platform's actual behaviour. */
const FAQS: { q: string; a: string; tag: string }[] = [
  { tag: 'Applications', q: 'How long does a government service take?', a: 'Every service publishes a statutory timeline under the Tamil Nadu Right to Service Act. The timeline and the days remaining are shown on each application in My Applications, along with the officer responsible.' },
  { tag: 'Applications', q: 'What happens after I submit an application?', a: 'Your application enters document verification, then an officer is assigned, then departmental review and approval. Each stage is recorded with a date, and you receive a notification at every transition.' },
  { tag: 'Applications', q: 'Can I save an application and finish it later?', a: 'Yes. Use Save draft on the application step. Your entries are stored on this device and restored the next time you open the same service.' },
  { tag: 'Documents', q: 'Where do approved certificates go?', a: 'Approved certificates are delivered automatically into your Digital Locker with a certificate number issued by the department. You can download or share them at any time.' },
  { tag: 'Documents', q: 'Can I import documents from DigiLocker?', a: 'Not yet. DigiLocker import will be enabled once official integration is granted; the option is visible but disabled so you can see where it will appear. Until then you can upload a file or reuse a document already verified in your locker.' },
  { tag: 'Grievances', q: 'How do I report a civic problem?', a: 'Open Grievances and file a report. The system routes it to the responsible department, assigns a priority and issues a tracking number with an expected resolution time.' },
  { tag: 'Schemes', q: 'How is my scheme eligibility calculated?', a: 'Eligibility is matched against your verified profile — district, income band and the documents in your locker. The match percentage is indicative; the department makes the final determination.' },
  { tag: 'Account', q: 'Is my Aadhaar number stored?', a: 'No. Vetri never stores your Aadhaar number: only the last four digits are shown. Sign-in codes are kept as a one-way hash for five minutes, and signing out ends your session immediately.' },
  { tag: 'Account', q: 'How do I change my registered address?', a: 'Addresses come from your Aadhaar-verified profile. To correct them, visit your Taluk e-Sevai centre with supporting proof; the change then flows into Vetri automatically.' },
  { tag: 'Account', q: 'Can I use Vetri in Tamil?', a: 'Yes. Switch language from the top bar or from Profile → Preferences. Scheme names, service names and navigation are available in Tamil.' },
]

const CONTACTS = [
  { icon: Phone, label: 'e-Sevai helpline', value: '1100', note: 'Government of Tamil Nadu, 8 am – 8 pm' },
  { icon: Phone, label: 'Emergency', value: '112', note: 'Single emergency number, 24×7' },
  { icon: Mail, label: 'Grievance escalation', value: 'Through your Taluk office', note: 'Escalate if the published timeline lapses' },
  { icon: Building2, label: 'Nearest e-Sevai centre', value: 'Taluk Office, Mylapore', note: 'For in-person assistance and document attestation' },
]

/**
 * Desktop help centre: searchable FAQ accordion alongside official contact
 * channels and escalation guidance. Content is static citizen-charter material,
 * so it needs no query — but it is written to match real platform behaviour.
 */
export default function DesktopHelp() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(FAQS[0].q)

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim()
    if (!n) return FAQS
    return FAQS.filter((f) => f.q.toLowerCase().includes(n) || f.a.toLowerCase().includes(n) || f.tag.toLowerCase().includes(n))
  }, [q])

  return (
    <>
      <PageHeader
        title="Help &amp; Support"
        subtitle="Answers about applying for services, tracking applications, your documents and your account."
        actions={<DeskBtn icon={Sparkles} onClick={() => onNav('ai')}>Ask Vetri instead</DeskBtn>}
      />

      <div className="vtn-split">
        <div>
          <Toolbar query={q} onQuery={setQ} placeholder="Search help topics…" />

          {rows.length === 0 ? (
            <div className="vtn-card">
              <EmptyState
                title="No help topic matches that search"
                desc="Try a different word, or ask Vetri — the assistant can answer questions about your own applications and documents."
                action={<DeskBtn variant="primary" onClick={() => onNav('ai')}>Ask Vetri</DeskBtn>}
              />
            </div>
          ) : (
            <Panel padded={false}>
              {rows.map((f, i) => {
                const isOpen = open === f.q
                return (
                  <div key={f.q} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                    <button
                      onClick={() => setOpen(isOpen ? null : f.q)}
                      aria-expanded={isOpen}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                    >
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: c.pri, background: `${c.pri}0F`, padding: '4px 9px', borderRadius: 6, flexShrink: 0 }}>{f.tag}</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: isOpen ? 700 : 500, color: c.txt }}>{f.q}</span>
                      <ChevronDown size={17} color={c.txt3} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }} />
                    </button>
                    {isOpen && (
                      <p style={{ padding: '0 20px 18px 20px', fontSize: 13.5, color: c.txt2, lineHeight: 1.75, maxWidth: '72ch' }}>{f.a}</p>
                    )}
                  </div>
                )
              })}
            </Panel>
          )}
        </div>

        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Official contacts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {CONTACTS.map((x) => (
                <div key={x.label} style={{ display: 'flex', gap: 12 }}>
                  <x.icon size={16} color={c.pri} style={{ marginTop: 3, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11.5, color: c.txt3 }}>{x.label}</p>
                    <p className="vtn-num" style={{ fontSize: 14, fontWeight: 700, color: c.txt, marginTop: 1 }}>{x.value}</p>
                    <p style={{ fontSize: 11.5, color: c.txt2, marginTop: 2, lineHeight: 1.5 }}>{x.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${c.bdr}` }}>
              <DeskBtn icon={LifeBuoy} onClick={() => onNav('emergency')}>Emergency directory</DeskBtn>
            </div>
          </Panel>

          <Panel title="Your rights">
            <p style={{ fontSize: 12.5, color: c.txt2, lineHeight: 1.75 }}>
              Under the Tamil Nadu Right to Service Act, every notified service must be delivered within its published
              timeline. If that timeline lapses, you may escalate to the designated appellate authority for the service —
              shown on the service page under <strong style={{ color: c.txt }}>Appeal process</strong>.
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: c.txt3, marginTop: 13, paddingTop: 12, borderTop: `1px solid ${c.bdr}` }}>
              <ShieldCheck size={14} color={c.ok} />Escalation is free of charge.
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}

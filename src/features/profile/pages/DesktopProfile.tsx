import { useState } from 'react'
import { User, MapPinned, Shield, Settings2, FileText, BadgeCheck, QrCode, LogOut, Languages, Moon, Sun, Eye, Type, Sparkles, ChevronRight, Smartphone } from 'lucide-react'
import { Seal } from '@/components/ui'
import { useC, useApp } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useWalletDocumentCards } from '@/features/documents/hooks/useDocuments'
import { usePlatformStore } from '@/store/platformStore'
import { PageHeader, Panel, DeskBtn, StatusChip } from '@/app/desktop/DesktopUI'

type TabId = 'personal' | 'address' | 'documents' | 'security' | 'preferences'

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'Personal details', icon: User },
  { id: 'address', label: 'Address', icon: MapPinned },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'security', label: 'Security & privacy', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Settings2 },
]

/** Label / value row used across the profile sections. */
function Row({ k, v, mono }: { k: string; v?: string; mono?: boolean }) {
  const c = useC()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${c.bdr}` }}>
      <span style={{ fontSize: 12.5, color: c.txt2 }}>{k}</span>
      <span className={mono ? 'vtn-num' : undefined} style={{ fontSize: 13.5, color: c.txt, fontWeight: 500 }}>{v || '\u2014'}</span>
    </div>
  )
}

/** Accessible preference switch. */
function Toggle({ label, desc, on, onChange, icon: Icon }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void; icon: typeof Eye }) {
  const c = useC()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: `1px solid ${c.bdr}` }}>
      <Icon size={17} color={c.pri} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt }}>{label}</p>
        <p style={{ fontSize: 12, color: c.txt2, marginTop: 2 }}>{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        style={{ width: 44, height: 25, borderRadius: 999, border: 'none', background: on ? c.pri : c.bdr, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .15s ease' }}
      >
        <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left .15s ease' }} />
      </button>
    </div>
  )
}

/**
 * Desktop citizen profile: identity card, tabbed sections for personal details,
 * address, documents, security and preferences. All values come from the same
 * auth store and document query as the mobile profile.
 */
export default function DesktopProfile() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { citizen, logout } = useAuth()
  const { dark, setDark, lang, setLang, textSize, setTextSize, highContrast, setHighContrast, anim, setAnim } = useApp()
  const docs = useWalletDocumentCards()
  const resetPlatform = usePlatformStore((s) => s.resetPlatform)
  const [tab, setTab] = useState<TabId>('personal')

  const addr = citizen?.addresses ?? []

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your verified government identity, documents and portal preferences." />

      <div className="vtn-dash">
        {/* Identity rail */}
        <aside style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: `linear-gradient(150deg, ${c.pri}, ${c.acc})`, borderRadius: 16, padding: 22, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.1, filter: 'grayscale(1) brightness(1.8)' }}><Seal size={160} /></div>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 60, height: 60, borderRadius: 17, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
                {(citizen?.fullName ?? 'C').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, marginTop: 14 }}>{citizen?.fullName ?? 'Citizen'}</p>
              <p className="vtn-num" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>{citizen?.citizenId ?? '—'}</p>
              <p style={{ fontSize: 12, color: c.secLt, marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <BadgeCheck size={14} />{(citizen?.verifiedVia ?? []).join(' + ') || 'Unverified'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => onNav('wallet')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 0', borderRadius: 9, background: 'rgba(255,255,255,0.16)', border: 'none', color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <QrCode size={13} />QR Verify
                </button>
              </div>
            </div>
          </div>

          <nav aria-label="Profile sections" className="vtn-card" style={{ overflow: 'hidden' }}>
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', background: tab === t.id ? `${c.pri}0F` : 'transparent', border: 'none', borderBottom: i < TABS.length - 1 ? `1px solid ${c.bdr}` : 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? c.pri : c.txt, fontFamily: 'inherit', textAlign: 'left' }}
              >
                <t.icon size={16} color={tab === t.id ? c.pri : c.txt3} />
                <span style={{ flex: 1 }}>{t.label}</span>
                <ChevronRight size={14} color={c.txt3} />
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DeskBtn icon={Smartphone} onClick={resetPlatform}>Switch Experience</DeskBtn>
            <button onClick={async () => { await logout(); onNav('login') }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1px solid ${c.err}3D`, background: `${c.err}0A`, color: c.err, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <LogOut size={15} />Log out
            </button>
          </div>
        </aside>

        {/* Section content */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {tab === 'personal' && (
            <Panel title="Personal details">
              <Row k="Full name" v={citizen?.fullName} />
              <Row k="Citizen ID" v={citizen?.citizenId} mono />
              <Row k="Date of birth" v={citizen?.dob} mono />
              <Row k="Gender" v={citizen?.gender} />
              <Row k="Mobile" v={citizen?.mobile} mono />
              <Row k="Email" v={citizen?.email} />
              <Row k="Aadhaar" v={citizen?.aadhaarMasked} mono />
              <p style={{ fontSize: 12, color: c.txt3, marginTop: 14 }}>
                Details are sourced from your Aadhaar-verified profile. To correct them, visit your Taluk e-Sevai centre.
              </p>
            </Panel>
          )}

          {tab === 'address' && (
            <Panel title="Registered addresses">
              {addr.length === 0 ? (
                <p style={{ fontSize: 13, color: c.txt2 }}>No address on record.</p>
              ) : (
                <div className="vtn-grid vtn-grid-2">
                  {addr.map((a) => (
                    <div key={a.id} style={{ border: `1px solid ${c.bdr}`, borderRadius: 12, padding: 16 }}>
                      <StatusChip label={a.kind === 'current' ? 'Current' : 'Permanent'} tone={a.kind === 'current' ? 'ok' : 'info'} />
                      <p style={{ fontSize: 13.5, color: c.txt, marginTop: 11, lineHeight: 1.6 }}>{a.line}</p>
                      <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 4 }}>{a.area}, {a.district}</p>
                      <p className="vtn-num" style={{ fontSize: 12.5, color: c.txt2, marginTop: 2 }}>{a.state} — {a.pincode}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {tab === 'documents' && (
            <Panel title={`Documents (${docs.length})`} action={<DeskBtn onClick={() => onNav('wallet')}>Open locker</DeskBtn>}>
              {docs.length === 0 ? (
                <p style={{ fontSize: 13, color: c.txt2 }}>Approved certificates will appear here automatically.</p>
              ) : (
                <div className="vtn-grid vtn-grid-3">
                  {docs.map((d) => (
                    <button key={d.id} onClick={() => onNav('wallet')} className="vtn-card vtn-hover" style={{ padding: 15, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <FileText size={18} color={d.cl} /><BadgeCheck size={14} color={c.ok} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: c.txt, marginTop: 10 }}>{d.n}</p>
                      <p className="vtn-num" style={{ fontSize: 11, color: c.txt3, marginTop: 3 }}>{d.id}</p>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {tab === 'security' && (
            <>
              <Panel title="Security">
                <Row k="Authentication" v="Mobile OTP (Aadhaar-linked)" />
                <Row k="Verification" v={(citizen?.verifiedVia ?? []).join(' + ') || 'Unverified'} />
                <Row k="Session" v="Encrypted · auto-refreshing token" />
                <div style={{ marginTop: 16 }}>
                  <DeskBtn onClick={() => onNav('security')} icon={Shield}>Open security settings</DeskBtn>
                </div>
              </Panel>
              <Panel title="Privacy">
                <p style={{ fontSize: 13, color: c.txt2, lineHeight: 1.7 }}>
                  Vetri never stores your Aadhaar number or one-time passwords. Documents in your locker are issued and signed by the originating
                  government department and are shared only when you explicitly authorise it.
                </p>
              </Panel>
            </>
          )}

          {tab === 'preferences' && (
            <>
              <Panel title="Display &amp; language">
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: `1px solid ${c.bdr}` }}>
                  <Languages size={17} color={c.pri} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt }}>Language</p>
                    <p style={{ fontSize: 12, color: c.txt2, marginTop: 2 }}>Portal language for all screens</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['en', 'ta'] as const).map((l) => (
                      <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                        style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${lang === l ? c.pri : c.bdr}`, background: lang === l ? c.pri : c.card, color: lang === l ? '#fff' : c.txt2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {l === 'en' ? 'English' : 'தமிழ்'}
                      </button>
                    ))}
                  </div>
                </div>

                <Toggle label="Dark mode" desc="Reduce glare in low-light conditions" on={dark} onChange={setDark} icon={dark ? Sun : Moon} />
                <Toggle label="High contrast" desc="Stronger text and border contrast" on={highContrast} onChange={setHighContrast} icon={Eye} />
                <Toggle label="Animations" desc="Motion and transitions across the portal" on={anim} onChange={setAnim} icon={Sparkles} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0' }}>
                  <Type size={17} color={c.pri} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt }}>Text size</p>
                    <p style={{ fontSize: 12, color: c.txt2, marginTop: 2 }}>Applies to every screen</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                      <button key={s} onClick={() => setTextSize(s)} aria-pressed={textSize === s}
                        style={{ width: 38, padding: '7px 0', borderRadius: 9, border: `1px solid ${textSize === s ? c.pri : c.bdr}`, background: textSize === s ? c.pri : c.card, color: textSize === s ? '#fff' : c.txt2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </>
  )
}

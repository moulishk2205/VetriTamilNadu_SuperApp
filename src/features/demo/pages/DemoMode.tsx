import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, Landmark, Settings, Play, CheckCircle, Sparkles, Building2 } from 'lucide-react'
import { StatusBar, Header, Card, Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAuthStore } from '@/store/authStore'
import { ROLE_HOME, type Role } from '@/lib/rbac/roles'

/**
 * Demo / Presentation Mode — the cockpit for stakeholder demonstrations.
 *
 * One tap logs in as each persona through the *real* auth pipeline (mock OTP
 * verify with a role claim → RBAC permissions → role-guarded portal), so the
 * demo exercises exactly what production would. All data is served by the
 * embedded mock backend, so the entire demonstration works offline.
 */

const PERSONAS: { role: Role; label: string; desc: string; icon: typeof User; home: string }[] = [
  { role: 'citizen', label: 'Citizen', desc: 'Chandramoulishwarar K · Mylapore', icon: User, home: ROLE_HOME.citizen },
  { role: 'officer', label: 'Officer', desc: 'Tmt. R. Kalaivani · Revenue Inspector', icon: Shield, home: ROLE_HOME.officer },
  { role: 'department', label: 'Department', desc: 'Revenue & Disaster Management', icon: Building2, home: ROLE_HOME.department },
  { role: 'mla', label: 'MLA', desc: 'Mylapore Assembly Constituency', icon: Landmark, home: ROLE_HOME.mla },
  { role: 'admin', label: 'Super Admin', desc: 'Platform administration', icon: Settings, home: ROLE_HOME.admin },
]

const SCRIPT = [
  'Citizen logs in with OTP / biometric',
  'AI greets with proactive "Ask Vetri" suggestions',
  'Tell the AI a life event — "I bought land"',
  'AI recommends services → launches Patta workflow',
  'Complete a service with wallet-assisted documents',
  'Submit → real Application ID → live tracking',
  'Switch to Officer — review, verify, approve & issue',
  'Certificate lands in the citizen Wallet + notification',
  'Open MLA Dashboard — constituency analytics',
  'Close with the Digital Citizen Timeline',
]

export default function DemoMode() {
  const c = useC()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [busy, setBusy] = useState<Role | null>(null)

  const enter = async (role: Role, home: string) => {
    setBusy(role)
    try {
      await login({ method: 'biometric', role })
      navigate(home)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <StatusBar />
      <div style={{ padding: '8px 20px' }}>
        <Header title="Presentation Mode" onBack={() => navigate('/')} />

        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg,${c.pri}08,${c.sec}0D), ${c.card}`, border: `1px solid ${c.pri}15` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Seal size={40} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: c.txt }}>Vetri Tamil Nadu</p>
              <p style={{ fontSize: 12, color: c.txt2 }}>Digital Governance Platform · fully offline demo</p>
            </div>
          </div>
        </Card>

        <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Enter as</p>
        {PERSONAS.map((p) => (
          <Card key={p.role} onClick={() => busy || enter(p.role, p.home)} style={{ marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.pri}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p.icon size={20} color={c.pri} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: c.txt }}>{p.label}</p>
                <p style={{ fontSize: 12, color: c.txt2 }}>{p.desc}</p>
              </div>
              {busy === p.role ? (
                <div style={{ width: 18, height: 18, border: `2px solid ${c.bdr}`, borderTopColor: c.pri, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Play size={16} color={c.txt3} />
              )}
            </div>
          </Card>
        ))}

        <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '18px 0 10px' }}>The one continuous story</p>
        <Card style={{ padding: 0 }}>
          {SCRIPT.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 16px', borderBottom: i < SCRIPT.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${c.pri}10`, color: c.pri, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, color: c.txt, lineHeight: 1.4 }}>{s}</span>
            </div>
          ))}
        </Card>

        <Card style={{ marginTop: 12, background: `${c.ok}06`, border: `1px solid ${c.ok}15` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle size={16} color={c.ok} style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: c.txt2, lineHeight: 1.5 }}>
              Every screen runs against the embedded backend — no internet required. Data resets on reload for a clean demo.
            </p>
          </div>
        </Card>

        <Card style={{ marginTop: 10, background: `linear-gradient(${c.sec}14,${c.sec}14), ${c.card}`, border: `1px solid ${c.sec}20` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Sparkles size={16} color={c.secDk} style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: c.txt2, lineHeight: 1.5 }}>
              Tip: open the AI as Citizen and say <em>“my father passed away”</em> or <em>“I bought land”</em> — Ask Vetri connects every related service in one conversation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

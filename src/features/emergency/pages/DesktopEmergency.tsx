import { Phone, HeartPulse, Flame, Siren, Shield, Users, Baby, TrainFront, Droplet, Zap, AlertTriangle } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Panel, DeskBtn } from '@/app/desktop/DesktopUI'

/** Official national and Tamil Nadu emergency numbers. */
const PRIMARY = [
  { icon: Siren, label: 'All Emergencies', n: '112', desc: 'Single national emergency number', cl: '#2563EB' },
  { icon: Phone, label: 'Police', n: '100', desc: 'Tamil Nadu Police control room', cl: '#DC2626' },
  { icon: HeartPulse, label: 'Ambulance', n: '108', desc: 'Free 108 emergency ambulance', cl: '#059669' },
  { icon: Flame, label: 'Fire & Rescue', n: '101', desc: 'Fire and Rescue Services', cl: '#EA580C' },
]

const SPECIALISED = [
  { icon: Users, label: 'Women Helpline', n: '181', desc: 'Women in distress' },
  { icon: Baby, label: 'Childline', n: '1098', desc: 'Children in need of care and protection' },
  { icon: Shield, label: 'Senior Citizen Helpline', n: '14567', desc: 'Elder support and abuse reporting' },
  { icon: AlertTriangle, label: 'Disaster Management', n: '1070', desc: 'State Emergency Operations Centre' },
  { icon: TrainFront, label: 'Railway Helpline', n: '139', desc: 'Railway enquiries and emergencies' },
  { icon: Droplet, label: 'Metro Water (Chennai)', n: '044-4567 4567', desc: 'Water supply and sewerage complaints' },
  { icon: Zap, label: 'TANGEDCO', n: '94987 94987', desc: 'Power failure and electrical hazards' },
  { icon: Phone, label: 'e-Sevai Helpline', n: '1100', desc: 'Government service assistance' },
]

/**
 * Desktop emergency directory. A calm, high-contrast reference page: four
 * primary numbers at large scale, then specialised helplines. Numbers are the
 * official national and Tamil Nadu published lines.
 */
export default function DesktopEmergency() {
  const c = useC()
  const { onNav } = useAppNavigation()

  return (
    <>
      <PageHeader
        title="Emergency Directory"
        subtitle="Official emergency and helpline numbers for Tamil Nadu. In a life-threatening emergency, dial 112."
        actions={<DeskBtn onClick={() => onNav('complaint')} icon={AlertTriangle}>Report a civic issue</DeskBtn>}
      />

      {/* Primary — deliberately oversized for fast recognition under stress */}
      <div className="vtn-grid vtn-grid-4" style={{ marginBottom: 24 }}>
        {PRIMARY.map((e) => (
          <a
            key={e.n}
            href={`tel:${e.n}`}
            className="vtn-card vtn-hover"
            style={{ textDecoration: 'none', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 12, borderColor: `${e.cl}3D`, background: `linear-gradient(${e.cl}0D, ${e.cl}0D), ${c.card}` }}
          >
            <span style={{ width: 48, height: 48, borderRadius: 13, background: `${e.cl}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <e.icon size={24} color={e.cl} />
            </span>
            <span>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: c.txt }}>{e.label}</span>
              <span className="vtn-num" style={{ display: 'block', fontSize: 'clamp(26px, 2.2vw, 34px)', fontWeight: 800, color: e.cl, lineHeight: 1.1, marginTop: 6 }}>{e.n}</span>
              <span style={{ display: 'block', fontSize: 12, color: c.txt2, marginTop: 6, lineHeight: 1.5 }}>{e.desc}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="vtn-split">
        <Panel title="Specialised helplines" padded={false}>
          {SPECIALISED.map((e, i, arr) => (
            <a
              key={e.label}
              href={`tel:${e.n.replace(/\s/g, '')}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none', textDecoration: 'none' }}
            >
              <span style={{ width: 36, height: 36, borderRadius: 10, background: `${c.pri}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <e.icon size={17} color={c.pri} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: c.txt }}>{e.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: c.txt2, marginTop: 2 }}>{e.desc}</span>
              </span>
              <span className="vtn-num" style={{ fontSize: 16, fontWeight: 800, color: c.pri, flexShrink: 0, whiteSpace: 'nowrap' }}>{e.n}</span>
            </a>
          ))}
        </Panel>

        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Before you call">
            <ul style={{ listStyle: 'none', display: 'grid', gap: 11 }}>
              {[
                'State your location first — street, landmark and district.',
                'Describe what happened and how many people are affected.',
                'Stay on the line until the operator confirms dispatch.',
                'Do not move a seriously injured person unless there is immediate danger.',
              ].map((t) => (
                <li key={t} style={{ display: 'flex', gap: 10, fontSize: 13, color: c.txt2, lineHeight: 1.6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.pri, marginTop: 7, flexShrink: 0 }} />{t}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Not an emergency?">
            <p style={{ fontSize: 13, color: c.txt2, lineHeight: 1.7 }}>
              For road damage, water supply, streetlights, drainage or sanitation, file a grievance instead. It is routed to
              the responsible department with a tracking number and a published resolution time.
            </p>
            <div style={{ marginTop: 14 }}>
              <DeskBtn variant="primary" onClick={() => onNav('complaint')}>File a grievance</DeskBtn>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

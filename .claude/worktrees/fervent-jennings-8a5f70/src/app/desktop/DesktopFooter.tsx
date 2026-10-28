import { Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'

/**
 * Government portal footer — service directory, policy links and the official
 * attribution line expected of a state e-governance property.
 */
const COLUMNS: { title: string; links: { l: string; key?: string }[] }[] = [
  { title: 'Citizen Services', links: [{ l: 'All Services', key: 'services' }, { l: 'Track Application', key: 'tracker' }, { l: 'Digital Locker', key: 'wallet' }, { l: 'Welfare Schemes', key: 'schemes' }] },
  { title: 'Grievances', links: [{ l: 'File a Complaint', key: 'complaint' }, { l: 'Complaint Status', key: 'tracker' }, { l: 'Help & FAQ', key: 'help' }] },
  { title: 'Transparency', links: [{ l: 'District Scorecard', key: 'district' }, { l: 'MLA Dashboard', key: 'mla' }, { l: 'Digital Timeline', key: 'timeline' }] },
  { title: 'About', links: [{ l: 'Accessibility', key: 'accessibility' }, { l: 'Privacy & Security', key: 'security' }, { l: 'Language / மொழி', key: 'language' }] },
]

export function DesktopFooter() {
  const c = useC()
  const { onNav } = useAppNavigation()

  return (
    <footer style={{ background: c.acc, color: 'rgba(255,255,255,0.78)', marginTop: 48 }}>
      <div className="vtn-container" style={{ padding: '38px clamp(16px, 3vw, 56px) 26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(230px, 1.3fr) repeat(auto-fit, minmax(150px, 1fr))', gap: 30 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Seal size={40} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Vetri Tamil Nadu</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>வெற்றி தமிழ்நாடு</p>
              </div>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.65, marginTop: 13, maxWidth: 280 }}>
              A unified digital gateway to Government of Tamil Nadu citizen services, certificates, welfare schemes and grievance redressal.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.4, marginBottom: 11 }}>{col.title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map((lk) => (
                  <button key={lk.l} onClick={() => lk.key && onNav(lk.key)} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'inherit', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>{lk.l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.14)', marginTop: 26, paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', fontSize: 11.5 }}>
          <span>© {new Date().getFullYear()} Government of Tamil Nadu. All rights reserved.</span>
          <span>Designed and maintained for the citizens of Tamil Nadu · e-Sevai</span>
        </div>
      </div>
    </footer>
  )
}

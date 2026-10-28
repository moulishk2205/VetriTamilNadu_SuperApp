import { Seal } from '@/components/ui'
import { useAppNavigation } from '@/hooks/useAppNavigation'

/**
 * Government portal footer — service directory, policy links and the official
 * attribution line expected of a state e-governance property. It sits quietly on
 * the page; only the slim red strip at the very bottom carries the banner colour,
 * as on the sign-in page.
 */
const COLUMNS: { title: string; links: { l: string; key?: string }[] }[] = [
  { title: 'Citizen Services', links: [{ l: 'All Services', key: 'services' }, { l: 'Track Application', key: 'tracker' }, { l: 'Digital Locker', key: 'wallet' }, { l: 'Welfare Schemes', key: 'schemes' }] },
  { title: 'Grievances', links: [{ l: 'File a Complaint', key: 'complaint' }, { l: 'Complaint Status', key: 'tracker' }, { l: 'Help & FAQ', key: 'help' }] },
  { title: 'Transparency', links: [{ l: 'District Scorecard', key: 'district' }, { l: 'MLA Dashboard', key: 'mla' }, { l: 'Digital Timeline', key: 'timeline' }] },
  { title: 'About', links: [{ l: 'Accessibility', key: 'accessibility' }, { l: 'Privacy & Security', key: 'security' }, { l: 'Language / மொழி', key: 'language' }] },
]

export function DesktopFooter() {
  const { onNav } = useAppNavigation()

  return (
    <footer className="vh-foot">
      <div className="vh-foot-in">
        <div className="vh-foot-brand">
          <div className="vh-foot-id">
            <Seal size={40} />
            <div>
              <p className="vh-foot-name">Vetri Tamil Nadu</p>
              <p className="vh-foot-ta" lang="ta">வெற்றி தமிழ்நாடு</p>
            </div>
          </div>
          <p className="vh-foot-about">
            A unified digital gateway to Government of Tamil Nadu citizen services, certificates, welfare schemes and grievance redressal.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="vh-foot-h">{col.title}</h2>
            {col.links.map((lk) => (
              <button key={lk.l} type="button" onClick={() => lk.key && onNav(lk.key)}>{lk.l}</button>
            ))}
          </nav>
        ))}
      </div>

      <div className="vh-foot-strip">
        <span>VETRI · prototype for the e-Sevai 2.0 programme · not an official Government service</span>
        <span>Designed and maintained for the citizens of Tamil Nadu · e-Sevai</span>
      </div>
    </footer>
  )
}

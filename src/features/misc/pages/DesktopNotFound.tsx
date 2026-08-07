import { Compass, Home, LayoutGrid, LifeBuoy } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Panel, DeskBtn } from '@/app/desktop/DesktopUI'

/**
 * Desktop 404. A dead end is never acceptable in a government portal, so this
 * page names what happened and offers the three routes a citizen most likely
 * wanted, rather than a bare error.
 */
export default function DesktopNotFound() {
  const c = useC()
  const { onNav } = useAppNavigation()

  return (
    <>
      <PageHeader
        title="Page not found"
        subtitle="The address you followed does not exist on this portal. It may have been moved, or the link may be incomplete."
      />

      <div className="vtn-split">
        <Panel>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ width: 48, height: 48, borderRadius: 13, background: `${c.pri}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Compass size={23} color={c.pri} strokeWidth={1.7} />
            </span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: c.txt }}>Where would you like to go?</p>
              <p style={{ fontSize: 13, color: c.txt2, marginTop: 6, lineHeight: 1.65, maxWidth: '62ch' }}>
                Nothing has gone wrong with your account or your applications. Use one of the links below, or the
                navigation bar above, to continue.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                <DeskBtn variant="primary" icon={Home} onClick={() => onNav('home')}>Go to dashboard</DeskBtn>
                <DeskBtn icon={LayoutGrid} onClick={() => onNav('services')}>Browse services</DeskBtn>
                <DeskBtn icon={LifeBuoy} onClick={() => onNav('help')}>Help &amp; support</DeskBtn>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Common destinations" padded={false}>
          {[
            { k: 'tracker', l: 'My Applications', d: 'Track anything you have filed' },
            { k: 'wallet', l: 'Digital Locker', d: 'Your verified documents' },
            { k: 'schemes', l: 'Welfare Schemes', d: 'Check what you are eligible for' },
            { k: 'complaint', l: 'Grievances', d: 'Report a civic issue' },
          ].map((x, i, arr) => (
            <button
              key={x.k}
              onClick={() => onNav(x.k)}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '13px 20px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600, color: c.pri }}>{x.l}</span>
              <span style={{ fontSize: 12, color: c.txt2 }}>{x.d}</span>
            </button>
          ))}
        </Panel>
      </div>
    </>
  )
}

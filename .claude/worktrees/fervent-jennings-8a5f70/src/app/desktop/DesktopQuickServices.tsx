import { Clock, ArrowRight } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useServiceCatalogView } from '@/features/services/hooks/useServices'

/**
 * Quick services grid — a wide, scannable catalogue block for large screens.
 * Reads the same `useServiceCatalogView()` the mobile Services hub uses, and
 * deep-links into the identical `/service/:slug` workflow.
 */
export function DesktopQuickServices({ limit = 8 }: { limit?: number }) {
  const c = useC()
  const { onNav } = useAppNavigation()
  const all = useServiceCatalogView()

  // Popular first, then the rest — stable, data-driven ordering.
  const items = [...all].sort((a, b) => Number(b.pop) - Number(a.pop)).slice(0, limit)

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt }}>Quick Services</h2>
          <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 3 }}>Most requested certificates and government services</p>
        </div>
        <button onClick={() => onNav('services')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: c.pri, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          View all <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {items.map((s) => (
          <button
            key={s.id}
            onClick={() => onNav(`service/${s.id}`)}
            style={{ textAlign: 'left', background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 14, padding: '17px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 11, transition: 'border-color 0.15s ease, transform 0.15s ease', fontFamily: 'inherit' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.pri; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.bdr; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: `${c.pri}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={c.pri} strokeWidth={1.8} />
              </span>
              {s.pop && <span style={{ fontSize: 9.5, fontWeight: 700, color: c.secDk, background: `${c.sec}22`, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.3 }}>POPULAR</span>}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.txt, lineHeight: 1.35 }}>{s.n}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 7 }}>
                <span style={{ fontSize: 11.5, color: c.txt2, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{s.time}</span>
                <span style={{ fontSize: 11.5, color: c.txt2 }}>{s.fee}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

import { Smartphone, Monitor, ArrowRight, ShieldCheck } from 'lucide-react'
import { Seal } from '@/components/ui'
import { lightColors as C } from '@/styles/theme'
import { usePlatformStore, type Platform } from '@/store/platformStore'

/**
 * Welcome experience — the first screen on a fresh visit. The citizen picks how
 * the SAME application should present itself: the mobile citizen super app, or
 * the desktop government portal. The choice persists in localStorage.
 *
 * Deliberately theme-independent (always the official maroon) so the very first
 * impression is consistent government branding.
 */
const OPTIONS: {
  id: Platform
  icon: typeof Smartphone
  emoji: string
  title: string
  tagline: string
  desc: string
  points: string[]
}[] = [
  {
    id: 'mobile',
    icon: Smartphone,
    emoji: '📱',
    title: 'Mobile Super App',
    tagline: 'For citizens',
    desc: 'Experience the application exactly like a mobile citizen app.',
    points: ['Native app layout', 'One-handed navigation', 'Quick Access shortcuts'],
  },
  {
    id: 'website',
    icon: Monitor,
    emoji: '🖥',
    title: 'Government Web Portal',
    tagline: 'For officials & presentations',
    desc: 'Experience the complete desktop portal optimized for presentations and laptop users.',
    points: ['Multi-column dashboard', 'Executive statistics', 'Large-screen widgets'],
  },
]

export function ExperienceSelector() {
  const setPlatform = usePlatformStore((s) => s.setPlatform)

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.pri} 0%, ${C.acc} 55%, #4E1220 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Emblem watermark — the same official asset, as background atmosphere. */}
      <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.06, filter: 'grayscale(1) brightness(1.8)', pointerEvents: 'none' }}>
        <Seal size={560} />
      </div>

      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 40 }}>
        <Seal size={64} />
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginTop: 14, letterSpacing: -0.5 }}>Vetri Tamil Nadu</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 6, fontFamily: "'Noto Sans Tamil', sans-serif" }}>வெற்றி தமிழ்நாடு · Government Super App</p>
        <div style={{ width: 44, height: 3, background: C.sec, borderRadius: 2, margin: '20px auto 0' }} />
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginTop: 22 }}>Choose Your Experience</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Same secure services. Two ways to use them.</p>
      </div>

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, width: '100%', maxWidth: 780 }}>
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setPlatform(o.id)}
            style={{ textAlign: 'left', background: 'rgba(255,255,255,0.97)', border: 'none', borderRadius: 22, padding: '26px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 18px 44px rgba(30,4,10,0.34)', transition: 'transform 0.18s ease, box-shadow 0.18s ease', fontFamily: 'inherit' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 26px 56px rgba(30,4,10,0.42)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 18px 44px rgba(30,4,10,0.34)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 50, height: 50, borderRadius: 15, background: `${C.pri}0F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <o.icon size={25} color={C.pri} strokeWidth={1.7} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.txt3 }}>{o.tagline}</span>
            </div>

            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>{o.emoji} {o.title}</p>
              <p style={{ fontSize: 13, color: C.txt2, marginTop: 6, lineHeight: 1.55 }}>{o.desc}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {o.points.map((p) => (
                <span key={p} style={{ fontSize: 12, color: C.txt2, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.sec }} />{p}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, color: C.pri, fontSize: 13, fontWeight: 700 }}>
              Continue <ArrowRight size={15} />
            </div>
          </button>
        ))}
      </div>

      <p style={{ position: 'relative', marginTop: 34, fontSize: 11.5, color: 'rgba(255,255,255,0.62)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <ShieldCheck size={14} color={C.sec} />
        You can switch anytime from Profile → Switch Experience
      </p>
    </div>
  )
}

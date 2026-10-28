import { useEffect, type ReactNode } from 'react'
import { Search, Inbox, Check } from 'lucide-react'
import { useApp, useC } from '@/hooks/useUi'
import { translations } from '@/lib/i18n/translations'

/**
 * Shared desktop portal primitives. One source of truth for page headers,
 * panels, chips, toolbars and empty/loading states so every module page has
 * identical rhythm and hierarchy (8-point spacing system).
 */

/** Page title block — the top of every desktop module page. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const c = useC()
  const { dark } = useApp()
  // Every portal page is named in both languages, the Tamil set in the banner
  // lettering above the English, the way the state's own signage reads.
  const ta = translations[title]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26 }}>
      <div>
        {ta && <p lang="ta" style={{ fontFamily: "'Noto Serif Tamil','Noto Sans Tamil',serif", fontWeight: 900, fontStretch: '80%', fontSize: 'clamp(18px, 1.45vw, 23px)', lineHeight: 1.25, color: dark ? '#FFC401' : c.pri, marginBottom: 2 }}>{ta}</p>}
        <h1 className="vtn-h1" style={{ color: c.txt, fontSize: 'clamp(30px, 2.7vw, 42px)' }}>{title}</h1>
        {subtitle && <p style={{ color: c.txt, opacity: 0.86, marginTop: 8, fontSize: 'clamp(15px, 1.15vw, 18px)', lineHeight: 1.5, maxWidth: '70ch' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

/** Bordered surface with an optional header row. */
export function Panel({ title, action, children, padded = true }: { title?: string; action?: ReactNode; children: ReactNode; padded?: boolean }) {
  const c = useC()
  return (
    <section className="vtn-card" style={{ overflow: 'hidden' }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px 14px', borderBottom: `1px solid ${c.bdr}` }}>
          <h2 style={{ flex: 1, margin: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.01em', color: c.txt }}>{title}</h2>
          {action}
        </div>
      )}
      <div style={padded ? { padding: 20 } : undefined}>{children}</div>
    </section>
  )
}

const TONES = { ok: 'ok', warn: 'warn', err: 'err', info: 'info', neutral: 'txt2' } as const

/** Status pill used across applications, grievances and documents. */
export function StatusChip({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof TONES }) {
  const c = useC()
  const col = c[TONES[tone]]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: col, background: `${col}14`, padding: tone !== 'neutral' ? '4px 11px 4px 9px' : '4px 11px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {tone !== 'neutral' && <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: col }} />}{label}
    </span>
  )
}

/** Search + filter bar. */
export function Toolbar({ query, onQuery, placeholder, children }: { query: string; onQuery: (v: string) => void; placeholder: string; children?: ReactNode }) {
  const c = useC()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 23, padding: '11px 18px', flex: '1 1 280px', minWidth: 0, boxShadow: '0 1px 2px rgba(60,40,0,.05)' }}>
        <Search size={16} color={c.txt3} />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: c.txt, fontSize: 14.5, fontFamily: 'inherit' }}
        />
      </div>
      {children}
    </div>
  )
}

/** Pill filter group. */
export function FilterChips({ options, value, onChange }: { options: { id: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void }) {
  const c = useC()
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            style={{ padding: '9px 16px', borderRadius: 9999, border: `1px solid ${active ? c.pri : c.bdr}`, background: active ? c.pri : c.card, color: active ? '#fff' : c.txt, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            {o.label}{o.count != null && <span className="vtn-num" style={{ opacity: 0.7 }}> · {o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Guidance-first empty state (never a bare "no data"). */
export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  const c = useC()
  return (
    <div style={{ textAlign: 'center', padding: '52px 24px' }}>
      <div style={{ width: 52, height: 52, borderRadius: 15, background: `${c.pri}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Inbox size={24} color={c.pri} strokeWidth={1.7} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: c.txt }}>{title}</p>
      <p style={{ fontSize: 13, color: c.txt2, marginTop: 6, maxWidth: 380, marginInline: 'auto', lineHeight: 1.6 }}>{desc}</p>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  )
}

/** Skeleton rows while a query is in flight. */
export function LoadingRows({ rows = 4 }: { rows?: number }) {
  const c = useC()
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 46, borderRadius: 10, background: c.bgAlt, opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  )
}

/** Primary / secondary desktop button. */
export function DeskBtn({ children, onClick, variant = 'secondary', icon: Icon }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'line'; icon?: typeof Search }) {
  const c = useC()
  const primary = variant === 'primary'
  const line = variant === 'line'
  return (
    <button
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 23, border: `${line ? 1.5 : 1}px solid ${primary || line ? c.pri : c.bdr}`, background: primary ? c.pri : line ? 'transparent' : c.card, color: primary ? '#fff' : line ? c.pri : c.txt, fontSize: 14, fontWeight: 650, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
    >
      {Icon && <Icon size={15} />}{children}
    </button>
  )
}

/** Transient confirmation toast — announced to assistive tech. */
export function Toast({ message, onDone, ms = 2600 }: { message: string; onDone: () => void; ms?: number }) {
  const c = useC()
  useEffect(() => {
    const t = setTimeout(onDone, ms)
    return () => clearTimeout(t)
  }, [message, ms, onDone])
  return (
    <div role="status" aria-live="polite"
      style={{ position: 'sticky', bottom: 16, marginTop: 16, marginInline: 'auto', width: 'fit-content', maxWidth: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 999, background: c.txt, color: c.bg, fontSize: 14, fontWeight: 600, boxShadow: '0 14px 30px -12px rgba(60,35,0,0.55)', zIndex: 60 }}>
      <Check size={15} />{message}
    </div>
  )
}

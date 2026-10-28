import type { ReactNode } from 'react'
import { Search, Inbox } from 'lucide-react'
import { useC } from '@/hooks/useUi'

/**
 * Shared desktop portal primitives. One source of truth for page headers,
 * panels, chips, toolbars and empty/loading states so every module page has
 * identical rhythm and hierarchy (8-point spacing system).
 */

/** Page title block — the top of every desktop module page. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const c = useC()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 className="vtn-h1" style={{ color: c.txt, fontSize: 'clamp(22px, 1.9vw, 30px)' }}>{title}</h1>
        {subtitle && <p className="vtn-lede" style={{ color: c.txt2, marginTop: 6 }}>{subtitle}</p>}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${c.bdr}` }}>
          <h2 style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: c.txt }}>{title}</h2>
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
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11.5, fontWeight: 700, color: col, background: `${col}18`, padding: '4px 11px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

/** Search + filter bar. */
export function Toolbar({ query, onQuery, placeholder, children }: { query: string; onQuery: (v: string) => void; placeholder: string; children?: ReactNode }) {
  const c = useC()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 11, padding: '9px 14px', flex: '1 1 280px', minWidth: 0 }}>
        <Search size={16} color={c.txt3} />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: c.txt, fontSize: 13.5, fontFamily: 'inherit' }}
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
            style={{ padding: '8px 14px', borderRadius: 9999, border: `1px solid ${active ? c.pri : c.bdr}`, background: active ? c.pri : c.card, color: active ? '#fff' : c.txt2, fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
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
export function DeskBtn({ children, onClick, variant = 'secondary', icon: Icon }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary'; icon?: typeof Search }) {
  const c = useC()
  const primary = variant === 'primary'
  return (
    <button
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1px solid ${primary ? c.pri : c.bdr}`, background: primary ? c.pri : c.card, color: primary ? '#fff' : c.txt, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
    >
      {Icon && <Icon size={15} />}{children}
    </button>
  )
}

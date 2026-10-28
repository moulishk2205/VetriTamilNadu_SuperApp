import type { ReactNode } from 'react'
import { AlertTriangle, WifiOff, Inbox, RefreshCw } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { ApiError } from '@/lib/api/errors'

/**
 * Shared async-state components. Every data screen can render loading / empty /
 * error / offline / unauthorized states through these without redesigning its
 * success view.
 */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const c = useC()
  return (
    <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${c.bdr}`, borderTopColor: c.pri, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: c.txt2 }}>{label}</p>
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', desc }: { title?: string; desc?: string }) {
  const c = useC()
  return (
    <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
      <Inbox size={32} color={c.txt3} />
      <p style={{ fontSize: 15, fontWeight: 600, color: c.txt }}>{title}</p>
      {desc && <p style={{ fontSize: 13, color: c.txt2 }}>{desc}</p>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const c = useC()
  const isOffline = error instanceof ApiError && error.kind === 'offline'
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
  return (
    <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center' }}>
      {isOffline ? <WifiOff size={32} color={c.warn} /> : <AlertTriangle size={32} color={c.err} />}
      <p style={{ fontSize: 14, fontWeight: 600, color: c.txt, maxWidth: 260 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ marginTop: 4, padding: '8px 16px', borderRadius: 10, background: c.pri, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  )
}

/**
 * Declarative async wrapper: pass a query-ish result and it renders the right
 * state, or `children` on success. Keeps state logic out of screens.
 */
export function AsyncBoundary({
  isLoading, isError, error, isEmpty, onRetry, loadingLabel, emptyTitle, children,
}: {
  isLoading?: boolean
  isError?: boolean
  error?: unknown
  isEmpty?: boolean
  onRetry?: () => void
  loadingLabel?: string
  emptyTitle?: string
  children: ReactNode
}) {
  if (isLoading) return <LoadingState label={loadingLabel} />
  if (isError) return <ErrorState error={error} onRetry={onRetry} />
  if (isEmpty) return <EmptyState title={emptyTitle} />
  return <>{children}</>
}

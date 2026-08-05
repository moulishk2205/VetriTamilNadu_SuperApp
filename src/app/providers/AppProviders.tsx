import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/config/queryClient'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Root provider stack for the whole application.
 *
 * CP0: server-state (TanStack Query) only. Later checkpoints layer additional
 * concerns here in a fixed order — error boundary, then theme/i18n bootstrap,
 * then the router — so every screen can rely on them being present.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ErrorBoundary>
  )
}

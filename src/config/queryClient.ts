import { QueryClient } from '@tanstack/react-query'

/**
 * Single shared TanStack Query client — the app's server-state cache.
 *
 * This owns caching, retries and background refetching for everything that
 * comes from the (mocked-then-real) backend. Client/UI/session state lives
 * separately in the Zustand stores under `src/store`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

import { env } from '@/config/env'

/**
 * Mock Service Worker bootstrap — kept available behind a feature flag but
 * DISABLED by default. The app now talks to the real NestJS backend
 * (see `@/config/env`); MSW is never removed, only gated off.
 *
 * When enabled (VITE_ENABLE_MSW=true) the worker + all mock handlers are
 * dynamically imported, so none of the mock code loads (or ships in the
 * critical path) when the app runs against the live backend.
 */
export async function enableMocking(): Promise<void> {
  if (!env.enableMocks) return

  try {
    const [{ setupWorker }, { handlers }] = await Promise.all([
      import('msw/browser'),
      import('./handlers'),
    ])
    const worker = setupWorker(...handlers)
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: false,
    })
  } catch (err) {
    // A mock-worker failure must never stop the application from mounting —
    // the app simply falls through to the real backend at env.apiBaseUrl.
    console.warn('[vetri] MSW did not start; continuing against the live API.', err)
  }
}

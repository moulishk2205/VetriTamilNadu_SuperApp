/**
 * Central runtime configuration — the single seam between the app and its backend.
 *
 * LIVE (default): the app talks to the real NestJS backend.
 *   - VITE_API_URL=http://localhost:4000     → requests go to <VITE_API_URL>/api/*
 *   - VITE_ENABLE_MSW is unset/false         → the MSW mock backend does NOT run
 *
 * OFFLINE MOCKS (opt-in): set VITE_ENABLE_MSW=true to run the in-browser MSW
 * mock backend instead (useful without a running server). No component or
 * API-layer code changes are needed either way.
 *
 * Advanced: VITE_API_BASE_URL overrides the resolved base directly (e.g. '/api'
 * to let MSW intercept relative requests). Legacy VITE_ENABLE_MOCKS still works
 * as an alias for VITE_ENABLE_MSW.
 */

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback
  return v === 'true' || v === '1'
}

/** Resolve the base URL every API path is joined onto. */
function resolveApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (explicit) return explicit.replace(/\/+$/, '')

  // VITE_API_URL is the server ORIGIN; the backend mounts everything under /api.
  const origin = import.meta.env.VITE_API_URL as string | undefined
  if (origin) return `${origin.replace(/\/+$/, '')}/api`

  // No backend configured → relative '/api' (what MSW intercepts).
  return '/api'
}

const enableMocks = bool(
  (import.meta.env.VITE_ENABLE_MSW ?? import.meta.env.VITE_ENABLE_MOCKS) as string | undefined,
  false, // MSW is OFF unless explicitly enabled with VITE_ENABLE_MSW=true
)

export const env = {
  /** Base URL every API request is resolved against (e.g. http://localhost:4000/api). */
  apiBaseUrl: resolveApiBaseUrl(),

  /** Whether the MSW mock backend should run. Off unless VITE_ENABLE_MSW=true. */
  enableMocks,

  /** Browser speech recognition / synthesis. OFF unless VITE_ENABLE_BROWSER_VOICE=true:
   *  the Web Speech API streams the citizen's audio to Google, Apple or Microsoft
   *  servers, so citizen data would leave the platform. */
  browserVoice: bool(import.meta.env.VITE_ENABLE_BROWSER_VOICE as string | undefined, false),

  /** Per-request timeout (ms) before the client aborts and raises a timeout. */
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 15000),

  /** Network retry budget for idempotent requests. */
  maxRetries: Number(import.meta.env.VITE_MAX_RETRIES ?? 2),

  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

export type Env = typeof env

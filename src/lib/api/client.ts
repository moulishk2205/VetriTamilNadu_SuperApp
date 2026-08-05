import type { ZodType } from 'zod'
import { env } from '@/config/env'
import { createLogger } from '@/lib/logger/logger'
import { ApiError, errorFromResponse, normalizeError } from './errors'
import { tokenStore } from './tokenStore'

const log = createLogger('api')

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestConfig<T = unknown> {
  method?: HttpMethod
  /** JSON-serialized as the request body. */
  body?: unknown
  headers?: Record<string, string>
  /** Query params appended to the URL. `undefined` values are dropped. */
  query?: Record<string, string | number | boolean | undefined>
  /** Zod schema; when present the response body is validated + typed as T. */
  schema?: ZodType<T>
  /** Attach the Authorization header. Default true. */
  auth?: boolean
  /** Force-enable/disable retry. Default: retry idempotent (GET/HEAD) only. */
  retry?: boolean
  timeoutMs?: number
  signal?: AbortSignal
}

// ── Interceptor registry (extensible; production hooks live here) ────────────
export interface RequestInterceptorCtx {
  url: string
  init: RequestInit
  config: RequestConfig
}
type RequestInterceptor = (ctx: RequestInterceptorCtx) => void | Promise<void>
type ResponseInterceptor = (res: Response, ctx: RequestInterceptorCtx) => void | Promise<void>

const requestInterceptors: RequestInterceptor[] = []
const responseInterceptors: ResponseInterceptor[] = []
export function addRequestInterceptor(fn: RequestInterceptor): void {
  requestInterceptors.push(fn)
}
export function addResponseInterceptor(fn: ResponseInterceptor): void {
  responseInterceptors.push(fn)
}

// Built-in auth interceptor: attach the bearer token unless opted out.
addRequestInterceptor(({ init, config }) => {
  if (config.auth === false) return
  const token = tokenStore.getAccessToken()
  if (token) {
    ;(init.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
})

function buildUrl(path: string, query?: RequestConfig['query']): string {
  const base = path.startsWith('http') ? path : `${env.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`
  if (!query) return base
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.append(k, String(v))
  const s = qs.toString()
  return s ? `${base}?${s}` : base
}

function withTimeout(timeoutMs: number, external?: AbortSignal): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('Request timeout', 'AbortError')), timeoutMs)
  const onAbort = () => controller.abort(external?.reason)
  if (external) {
    if (external.aborted) controller.abort(external.reason)
    else external.addEventListener('abort', onAbort, { once: true })
  }
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer)
      external?.removeEventListener('abort', onAbort)
    },
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isIdempotent = (m: HttpMethod) => m === 'GET'

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

async function once<T>(path: string, config: RequestConfig<T>): Promise<T> {
  const method = config.method ?? 'GET'
  const url = buildUrl(path, config.query)
  const init: RequestInit = {
    method,
    headers: { Accept: 'application/json', ...config.headers },
  }
  if (config.body !== undefined) {
    ;(init.headers as Record<string, string>)['Content-Type'] = 'application/json'
    init.body = JSON.stringify(config.body)
  }

  const ctx: RequestInterceptorCtx = { url, init, config }
  for (const fn of requestInterceptors) await fn(ctx)

  const { signal, done } = withTimeout(config.timeoutMs ?? env.requestTimeoutMs, config.signal)
  init.signal = signal

  let res: Response
  try {
    res = await fetch(url, init)
  } catch (e) {
    done()
    throw normalizeError(e)
  }
  done()

  for (const fn of responseInterceptors) await fn(res, ctx)

  if (!res.ok) {
    let body: { message?: string; code?: string; fieldErrors?: Record<string, string[]> } | undefined
    try {
      body = (await parseBody(res)) as typeof body
    } catch {
      body = undefined
    }
    throw errorFromResponse(res.status, body)
  }

  const data = await parseBody(res)
  if (!config.schema) return data as T
  const parsed = config.schema.safeParse(data)
  if (!parsed.success) {
    log.error('response failed contract validation', { url, issues: parsed.error.issues })
    throw new ApiError({
      kind: 'validation',
      message: 'The server returned unexpected data.',
      retryable: false,
      cause: parsed.error,
    })
  }
  return parsed.data
}

/**
 * Perform a request with retry + 401 refresh recovery.
 * The single entry point every feature API module uses.
 */
export async function request<T>(path: string, config: RequestConfig<T> = {}): Promise<T> {
  const method = config.method ?? 'GET'
  const retryEnabled = config.retry ?? isIdempotent(method)
  let attempt = 0
  let refreshed = false

  for (;;) {
    try {
      return await once<T>(path, config)
    } catch (e) {
      const err = e instanceof ApiError ? e : normalizeError(e)

      // Recover once from a 401 via token refresh, then retry the request.
      if (err.kind === 'unauthorized' && config.auth !== false && !refreshed && tokenStore.canRefresh()) {
        refreshed = true
        const token = await tokenStore.refresh().catch(() => null)
        if (token) {
          log.info('retrying after token refresh', { path })
          continue
        }
      }

      if (retryEnabled && err.retryable && attempt < env.maxRetries) {
        const backoff = 300 * 2 ** attempt
        attempt += 1
        log.warn('retrying request', { path, attempt, kind: err.kind, backoff })
        await sleep(backoff)
        continue
      }
      throw err
    }
  }
}

/** Ergonomic verb helpers over `request`. */
export const apiClient = {
  get: <T>(path: string, config?: Omit<RequestConfig<T>, 'method' | 'body'>) => request<T>(path, { ...config, method: 'GET' }),
  post: <T>(path: string, body?: unknown, config?: Omit<RequestConfig<T>, 'method'>) => request<T>(path, { ...config, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, config?: Omit<RequestConfig<T>, 'method'>) => request<T>(path, { ...config, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, config?: Omit<RequestConfig<T>, 'method'>) => request<T>(path, { ...config, method: 'PATCH', body }),
  del: <T>(path: string, config?: Omit<RequestConfig<T>, 'method' | 'body'>) => request<T>(path, { ...config, method: 'DELETE' }),
}

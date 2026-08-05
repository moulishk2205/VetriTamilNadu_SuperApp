/**
 * Normalized error model for the whole app.
 *
 * Every failure — network drop, timeout, HTTP status, or bad payload — is
 * converted into a single `ApiError` with a stable `kind`, so UI and hooks can
 * branch on `kind` (→ loading/empty/error/unauthorized/offline states) without
 * caring where the failure came from.
 */

export type ApiErrorKind =
  | 'offline'
  | 'timeout'
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'conflict'
  | 'rateLimited'
  | 'server'
  | 'unknown'

export interface ApiErrorPayload {
  kind: ApiErrorKind
  message: string
  status?: number
  /** Backend error code, e.g. 'OTP_EXPIRED'. */
  code?: string
  /** Field-level validation errors, keyed by field path. */
  fieldErrors?: Record<string, string[]>
  /** Whether retrying the same request could plausibly succeed. */
  retryable: boolean
  cause?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code?: string
  readonly fieldErrors?: Record<string, string[]>
  readonly retryable: boolean
  override readonly cause?: unknown

  constructor(payload: ApiErrorPayload) {
    super(payload.message)
    this.name = 'ApiError'
    this.kind = payload.kind
    this.status = payload.status
    this.code = payload.code
    this.fieldErrors = payload.fieldErrors
    this.retryable = payload.retryable
    this.cause = payload.cause
  }
}

const STATUS_KIND: Record<number, ApiErrorKind> = {
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'notFound',
  409: 'conflict',
  422: 'validation',
  429: 'rateLimited',
}

/** Map an HTTP status + optional backend body into an ApiError. */
export function errorFromResponse(
  status: number,
  body?: { message?: string; code?: string; fieldErrors?: Record<string, string[]> },
): ApiError {
  const kind: ApiErrorKind = STATUS_KIND[status] ?? (status >= 500 ? 'server' : 'unknown')
  return new ApiError({
    kind,
    status,
    code: body?.code,
    message: body?.message ?? defaultMessage(kind),
    fieldErrors: body?.fieldErrors,
    retryable: kind === 'server' || kind === 'rateLimited',
  })
}

/** Convert any thrown value (fetch reject, abort, non-Error) into an ApiError. */
export function normalizeError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new ApiError({ kind: 'offline', message: defaultMessage('offline'), retryable: true, cause: e })
  }
  if (e instanceof DOMException && e.name === 'AbortError') {
    return new ApiError({ kind: 'timeout', message: defaultMessage('timeout'), retryable: true, cause: e })
  }
  if (e instanceof TypeError) {
    // fetch throws TypeError on network failure
    return new ApiError({ kind: 'network', message: defaultMessage('network'), retryable: true, cause: e })
  }
  return new ApiError({ kind: 'unknown', message: e instanceof Error ? e.message : 'Something went wrong', retryable: false, cause: e })
}

function defaultMessage(kind: ApiErrorKind): string {
  switch (kind) {
    case 'offline':
      return 'You appear to be offline. Check your connection and try again.'
    case 'timeout':
      return 'The request took too long. Please try again.'
    case 'network':
      return 'Could not reach the server. Please try again.'
    case 'unauthorized':
      return 'Your session has expired. Please sign in again.'
    case 'forbidden':
      return "You don't have permission to do that."
    case 'notFound':
      return 'We could not find what you were looking for.'
    case 'validation':
      return 'Some details need to be corrected.'
    case 'conflict':
      return 'That action conflicts with the current state.'
    case 'rateLimited':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'server':
      return 'The service is temporarily unavailable. Please try again shortly.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

/**
 * In-memory holder for the current access token + a refresh delegate.
 *
 * Kept deliberately separate from the auth store to avoid a circular import
 * (api client → auth store → api client). CP4's auth flow writes the token here
 * on login/refresh and clears it on logout; the API client reads it to attach
 * the Authorization header and to recover from a 401 via `refresh`.
 */

type RefreshFn = () => Promise<string | null>

let accessToken: string | null = null
let refreshFn: RefreshFn | null = null
let inflight: Promise<string | null> | null = null

export const tokenStore = {
  getAccessToken: (): string | null => accessToken,
  setAccessToken: (token: string | null): void => {
    accessToken = token
  },
  clear: (): void => {
    accessToken = null
  },
  /** Register how the client should obtain a fresh token after a 401. */
  setRefreshHandler: (fn: RefreshFn | null): void => {
    refreshFn = fn
  },
  /** Single-flight: concurrent 401s share one refresh. Refresh tokens rotate
   *  and are single-use, so parallel refreshes would revoke each other. */
  refresh: (): Promise<string | null> => {
    const fn = refreshFn
    if (!fn) return Promise.resolve(null)
    inflight ??= fn()
      .then((token) => {
        accessToken = token
        return token
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  },
  canRefresh: (): boolean => refreshFn !== null,
}

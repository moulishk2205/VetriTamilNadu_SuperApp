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
// One refresh at a time: every request that hits a 401 while it is running
// shares the same attempt instead of each spending the refresh token.
let inFlight: Promise<string | null> | null = null

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
  refresh: (): Promise<string | null> => {
    if (!refreshFn) return Promise.resolve(null)
    inFlight ??= refreshFn()
      .then((token) => {
        accessToken = token
        return token
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  },
  canRefresh: (): boolean => refreshFn !== null,
}

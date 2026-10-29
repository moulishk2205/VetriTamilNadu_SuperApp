/**
 * Live data: queries for work in progress refetch on this interval, so a
 * citizen sees an officer's decision (status, timeline, notification) and an
 * officer sees new cases without reloading. React Query pauses it while the
 * tab is in the background. 8 s keeps one person with a citizen tab and an
 * officer tab open well under the API's 120 requests a minute.
 */
export const LIVE = { refetchInterval: 8_000 } as const

/**
 * Canonical route paths, and the legacy screen-key → path map.
 *
 * The prototype navigated by string keys (`onNav("wallet")`). Those call sites
 * are preserved unchanged; `useAppNavigation` translates the key to a real URL
 * through this table, so every screen now has a bookmarkable, deep-linkable
 * address without touching screen code.
 */
export const keyToPath: Record<string, string> = {
  splash: '/',
  onboarding: '/onboarding',
  login: '/login',
  home: '/home',
  services: '/services',
  wallet: '/wallet',
  complaint: '/complaint',
  ai: '/ai',
  schemes: '/schemes',
  emergency: '/emergency',
  mla: '/mla',
  district: '/district',
  tracker: '/tracker',
  profile: '/profile',
  notifications: '/notifications',
  help: '/help',
  accessibility: '/accessibility',
  personal: '/personal',
  address: '/address',
  security: '/security',
  language: '/language',
  darkmode: '/darkmode',
  timeline: '/timeline',
}

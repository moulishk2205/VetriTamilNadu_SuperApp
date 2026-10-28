/**
 * Secure storage abstraction — the encryption-at-rest seam.
 *
 * Phase 3 ships an obfuscating adapter over localStorage (base64 + key prefix);
 * production swaps `codec` for Web Crypto AES-GCM with a backend-provisioned
 * key, or the native platform keystore, without changing any call site.
 */

const PREFIX = 'vetri.sec.'

const codec = {
  encode: (plain: string): string => btoa(unescape(encodeURIComponent(plain))),
  decode: (stored: string): string => decodeURIComponent(escape(atob(stored))),
}

export const secureStorage = {
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, codec.encode(JSON.stringify(value)))
    } catch {
      /* storage full/unavailable — degrade silently */
    }
  },
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? (JSON.parse(codec.decode(raw)) as T) : null
    } catch {
      return null
    }
  },
  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },
}

import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/** Origin of the configured backend, or null when it is same-origin ('/api'). */
function apiOrigin(env: Record<string, string>): string | null {
  const url = env.VITE_API_BASE_URL || env.VITE_API_URL
  if (!url || url.startsWith('/')) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

/**
 * Content-Security-Policy for production builds, as a <meta> tag so it ships
 * with the static bundle. Scripts, styles and fonts load only from this origin
 * (fonts are self-hosted); the only other origin is the backend. Inline styles stay allowed because
 * the app renders <style> blocks. Dev builds skip it (Vite injects inline
 * scripts for hot reload). frame-ancestors cannot be set from a meta tag: the
 * host serving dist/ must also send `frame-ancestors 'none'` as a header.
 */
function contentSecurityPolicy(api: string | null): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    `connect-src 'self'${api ? ` ${api}` : ''}`,
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'vetri-csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }],
  }
}

/**
 * `/api` is proxied to the backend, so with VITE_API_BASE_URL=/api every device
 * (a phone on the same Wi-Fi, a tunnel visitor) talks to one origin and the
 * certificate QR links resolve from anywhere. `xfwd` passes the visitor's
 * address on, so the backend (with TRUST_PROXY=1) rate-limits each person, not
 * the proxy. Set API_PROXY_TARGET to point at a backend other than :4000.
 */
const apiProxy = {
  '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:4000', changeOrigin: false, xfwd: true },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), contentSecurityPolicy(apiOrigin(loadEnv(mode, process.cwd(), 'VITE_')))],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // host: true listens on every interface, so other devices on the network can open it.
  // allowedHosts admits Cloudflare quick-tunnel links for sharing the demo.
  server: { host: true, proxy: apiProxy, allowedHosts: ['.trycloudflare.com'] },
  preview: { host: true, proxy: apiProxy },
}))

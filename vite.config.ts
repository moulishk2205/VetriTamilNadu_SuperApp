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
 * with the static bundle. Scripts load only from this origin; the only other
 * origins are the backend and Google Fonts. Inline styles stay allowed because
 * the app renders <style> blocks. Dev builds skip it (Vite injects inline
 * scripts for hot reload). frame-ancestors cannot be set from a meta tag: the
 * host serving dist/ must also send `frame-ancestors 'none'` as a header.
 */
function contentSecurityPolicy(api: string | null): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), contentSecurityPolicy(apiOrigin(loadEnv(mode, process.cwd(), 'VITE_')))],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))

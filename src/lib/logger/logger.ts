import { env } from '@/config/env'

/**
 * Structured application logger.
 *
 * Wraps console with levels + structured context and keeps a bounded in-memory
 * ring buffer. Phase 2 forwards `error`/`warn` entries (and the buffer on crash)
 * to a real sink — Sentry, an analytics pipeline, or the backend — by swapping
 * only the `sink` function; call sites never change.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  ts: string
  level: LogLevel
  scope: string
  message: string
  context?: Record<string, unknown>
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const MIN_LEVEL: LogLevel = env.isDev ? 'debug' : 'warn'
const BUFFER_LIMIT = 200
const buffer: LogEntry[] = []

function sink(entry: LogEntry): void {
  // Phase 2: forward to remote sink. For now, mirror to console.
  const line = `[${entry.scope}] ${entry.message}`
  const args = entry.context ? [line, entry.context] : [line]
  if (entry.level === 'error') console.error(...args)
  else if (entry.level === 'warn') console.warn(...args)
  else if (entry.level === 'info') console.info(...args)
  else console.debug(...args)
}

function emit(level: LogLevel, scope: string, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = { ts: new Date().toISOString(), level, scope, message, context }
  buffer.push(entry)
  if (buffer.length > BUFFER_LIMIT) buffer.shift()
  if (LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL]) sink(entry)
}

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void
  info: (message: string, context?: Record<string, unknown>) => void
  warn: (message: string, context?: Record<string, unknown>) => void
  error: (message: string, context?: Record<string, unknown>) => void
}

/** Create a scoped logger, e.g. `createLogger('api')`. */
export function createLogger(scope: string): Logger {
  return {
    debug: (m, c) => emit('debug', scope, m, c),
    info: (m, c) => emit('info', scope, m, c),
    warn: (m, c) => emit('warn', scope, m, c),
    error: (m, c) => emit('error', scope, m, c),
  }
}

/** Snapshot of recent log entries (for crash reports / a future debug view). */
export function getLogBuffer(): readonly LogEntry[] {
  return buffer
}

export const logger = createLogger('app')

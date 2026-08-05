import { randomUUID } from 'crypto'
import type { GatewayAdapter, GatewayOp, GatewayResult } from '../gateway.types'

/**
 * Base mock adapter. Provides deterministic, realistically-shaped responses for
 * all seven gateway operations. Concrete adapters override `payloadFor()` to
 * return system-specific data (e.g. Aadhaar demographics, RTO licence record).
 */
export abstract class BaseMockAdapter implements GatewayAdapter {
  abstract readonly key: string
  abstract readonly name: string

  protected result<T>(op: GatewayOp, data?: T, extra?: Partial<GatewayResult<T>>): GatewayResult<T> {
    return {
      adapter: this.key, op, ok: true, mode: 'mock',
      referenceId: `${this.key.toUpperCase()}-${randomUUID().slice(0, 8)}`,
      data, at: new Date().toISOString(), ...extra,
    }
  }

  /** Per-adapter payload. Default echoes the request; adapters override. */
  protected payloadFor(op: GatewayOp, payload: Record<string, unknown>): unknown {
    return { op, echo: payload }
  }

  validate(p: Record<string, unknown>) { return Promise.resolve(this.result('validate', { valid: true, ...this.asObj(this.payloadFor('validate', p)) })) }
  fetch(p: Record<string, unknown>) { return Promise.resolve(this.result('fetch', this.payloadFor('fetch', p))) }
  submit(p: Record<string, unknown>) { return Promise.resolve(this.result('submit', this.payloadFor('submit', p), { message: 'Accepted for processing' })) }
  update(p: Record<string, unknown>) { return Promise.resolve(this.result('update', this.payloadFor('update', p), { message: 'Record updated' })) }
  track(p: Record<string, unknown>) { return Promise.resolve(this.result('track', { stage: 'in-progress', ...this.asObj(this.payloadFor('track', p)) })) }
  download(p: Record<string, unknown>) { return Promise.resolve(this.result('download', { url: `mock://${this.key}/document.pdf`, ...this.asObj(this.payloadFor('download', p)) })) }
  status() { return Promise.resolve(this.result('status', { available: true, latencyMs: 42, uptime: '99.9%' })) }

  private asObj(v: unknown): Record<string, unknown> {
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  }
}

/**
 * Government Integration Layer contracts.
 *
 * Every external system (UIDAI/Aadhaar, DigiLocker, RTO, Revenue, Municipality,
 * Police, Transport, Treasury, Payment, Certificate Authority) is reached
 * through one uniform adapter interface. Today these are deterministic MOCK
 * adapters (GATEWAY_MODE=mock); flipping an adapter to a live client is a
 * drop-in replacement — controllers/services never change.
 */

export type GatewayOp = 'validate' | 'fetch' | 'submit' | 'update' | 'track' | 'download' | 'status'

export interface GatewayResult<T = unknown> {
  adapter: string
  op: GatewayOp
  ok: boolean
  mode: 'mock' | 'live'
  referenceId?: string
  data?: T
  message?: string
  at: string
}

export interface GatewayAdapter {
  readonly key: string
  readonly name: string
  validate(payload: Record<string, unknown>): Promise<GatewayResult>
  fetch(payload: Record<string, unknown>): Promise<GatewayResult>
  submit(payload: Record<string, unknown>): Promise<GatewayResult>
  update(payload: Record<string, unknown>): Promise<GatewayResult>
  track(payload: Record<string, unknown>): Promise<GatewayResult>
  download(payload: Record<string, unknown>): Promise<GatewayResult>
  status(payload: Record<string, unknown>): Promise<GatewayResult>
}

import type { CapabilityMap, IntegrationCapability } from './types'
import {
  mockDigiLocker, mockParivahan, mockTamilNilam, mockServiceGateway,
  mockAadhaar, mockPan, mockSms, mockEmail, mockPush, mockPayment,
  mockMaps, mockGeolocation, mockESign,
} from './adapters/mock'

/**
 * Integration Gateway registry.
 *
 * Features resolve a provider by capability (`gateway.get('digilocker')`) and
 * receive the currently-registered adapter. Going live = `gateway.register(cap,
 * liveAdapter)` at startup; call sites are untouched.
 */
const registry: { [K in IntegrationCapability]: CapabilityMap[K] } = {
  digilocker: mockDigiLocker,
  parivahan: mockParivahan,
  tamilnilam: mockTamilNilam,
  esevai: mockServiceGateway,
  tnega: { ...mockServiceGateway, capability: 'tnega', provider: 'TNeGA (mock)' },
  aadhaar: mockAadhaar,
  pan: mockPan,
  sms: mockSms,
  email: mockEmail,
  push: mockPush,
  payment: mockPayment,
  maps: mockMaps,
  geolocation: mockGeolocation,
  esign: mockESign,
}

export const gateway = {
  get<K extends IntegrationCapability>(capability: K): CapabilityMap[K] {
    return registry[capability]
  },
  register<K extends IntegrationCapability>(capability: K, adapter: CapabilityMap[K]): void {
    registry[capability] = adapter
  },
  /** Health snapshot across all registered providers (for an admin panel later). */
  async healthAll(): Promise<Record<IntegrationCapability, boolean>> {
    const entries = await Promise.all(
      (Object.keys(registry) as IntegrationCapability[]).map(async (cap) => {
        const res = await registry[cap].healthCheck().catch(() => ({ ok: false }))
        return [cap, res.ok] as const
      }),
    )
    return Object.fromEntries(entries) as Record<IntegrationCapability, boolean>
  },
}

import type {
  DigiLockerAdapter, ParivahanAdapter, TamilNilamAdapter, ServiceGatewayAdapter,
  AadhaarAdapter, PanAdapter, SmsAdapter, EmailAdapter, PushAdapter, PaymentAdapter,
  MapsAdapter, GeolocationAdapter, ESignAdapter,
} from '../types'
import { createLogger } from '@/lib/logger/logger'

const log = createLogger('integrations')
const ok = () => Promise.resolve({ ok: true, detail: 'mock' })
const id = (p: string) => `${p}_${Date.now().toString(36)}`

/**
 * Mock adapters for Phase 1. Each satisfies its official interface and logs the
 * call, so behaviour is observable and the swap to a live adapter is isolated.
 */

export const mockDigiLocker: DigiLockerAdapter = {
  capability: 'digilocker', provider: 'DigiLocker (mock)', mode: 'mock', healthCheck: ok,
  pullDocument: async (refId) => { log.info('digilocker.pull', { refId }); return { id: refId, fileUrl: `mock://doc/${refId}.pdf`, verified: true } },
  listIssued: async (citizenId) => { log.info('digilocker.list', { citizenId }); return [] },
}

export const mockParivahan: ParivahanAdapter = {
  capability: 'parivahan', provider: 'Parivahan (mock)', mode: 'mock', healthCheck: ok,
  verifyLicence: async (_dl) => ({ valid: true, holder: 'MOCK HOLDER', validTill: '12/2029' }),
  vehicleDetails: async () => null,
}

export const mockTamilNilam: TamilNilamAdapter = {
  capability: 'tamilnilam', provider: 'TamilNilam (mock)', mode: 'mock', healthCheck: ok,
  pattaDetails: async () => null,
}

export const mockServiceGateway: ServiceGatewayAdapter = {
  capability: 'esevai', provider: 'e-Sevai (mock)', mode: 'mock', healthCheck: ok,
  submitService: async (serviceId) => { log.info('esevai.submit', { serviceId }); return { referenceNo: id('ESV') } },
  serviceStatus: async () => ({ status: 'pending' }),
}

export const mockAadhaar: AadhaarAdapter = {
  capability: 'aadhaar', provider: 'UIDAI (mock)', mode: 'mock', healthCheck: ok,
  requestOtp: async () => ({ txnId: id('AADHAAR') }),
  verifyOtp: async () => ({ verified: true, kyc: {} }),
}

export const mockPan: PanAdapter = {
  capability: 'pan', provider: 'PAN (mock)', mode: 'mock', healthCheck: ok,
  verify: async () => ({ valid: true, name: 'MOCK NAME' }),
}

export const mockSms: SmsAdapter = {
  capability: 'sms', provider: 'SMS (mock)', mode: 'mock', healthCheck: ok,
  send: async (to, template) => { log.info('sms.send', { to, template }); return { messageId: id('SMS') } },
}

export const mockEmail: EmailAdapter = {
  capability: 'email', provider: 'Email (mock)', mode: 'mock', healthCheck: ok,
  send: async (to, subject) => { log.info('email.send', { to, subject }); return { messageId: id('EML') } },
}

export const mockPush: PushAdapter = {
  capability: 'push', provider: 'Push (mock)', mode: 'mock', healthCheck: ok,
  send: async (_t, title) => { log.info('push.send', { title }); return { messageId: id('PSH') } },
}

export const mockMaps: MapsAdapter = {
  capability: 'maps', provider: 'Maps (mock)', mode: 'mock', healthCheck: ok,
  nearby: async (kind) => { log.info('maps.nearby', { kind }); return [{ name: kind === 'hospital' ? 'Govt. Royapettah Hospital' : kind === 'police' ? 'Mylapore Police Station' : 'e-Sevai Maiyam, Mylapore', distanceKm: 1.2 }] },
}

export const mockGeolocation: GeolocationAdapter = {
  capability: 'geolocation', provider: 'Geolocation (browser)', mode: 'mock', healthCheck: ok,
  current: async () => ({ lat: 13.0368, lng: 80.2676, label: 'Ward 126, Mylapore' }),
}

export const mockESign: ESignAdapter = {
  capability: 'esign', provider: 'eSign (mock DSC)', mode: 'mock', healthCheck: ok,
  sign: async (documentRef, signer) => { log.info('esign.sign', { documentRef, signer }); return { signatureId: id('SIG'), signedAt: new Date().toISOString() } },
  verify: async () => ({ valid: true }),
}

export const mockPayment: PaymentAdapter = {
  capability: 'payment', provider: 'Payment (mock)', mode: 'mock', healthCheck: ok,
  createOrder: async (amount, currency) => { log.info('payment.order', { amount, currency }); const o = id('ORD'); return { orderId: o, payUrl: `mock://pay/${o}` } },
  verifyPayment: async () => ({ status: 'paid' }),
}

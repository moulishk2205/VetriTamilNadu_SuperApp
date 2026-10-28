/**
 * Integration Gateway — adapter interfaces for external government systems.
 *
 * Phase 1 ships clean interfaces + mock adapters (MSW-backed). Phase 2 replaces
 * each mock with an official-API adapter by registering it in the gateway — no
 * feature code changes, because features depend on these interfaces, never on a
 * concrete provider.
 */

export type IntegrationCapability =
  | 'digilocker' // verified document vault
  | 'parivahan' // transport / driving licence / RC
  | 'tamilnilam' // land records (patta)
  | 'esevai' // TN e-Sevai service gateway
  | 'tnega' // TN e-Governance data
  | 'aadhaar' // UIDAI eKYC / auth
  | 'pan' // PAN verification
  | 'sms' // DLT SMS gateway
  | 'email' // transactional email
  | 'push' // FCM / APNs
  | 'payment' // payment gateway
  | 'maps' // maps / nearby facilities
  | 'geolocation' // device location
  | 'esign' // digital signature (eSign / DSC)

/** Base contract every adapter implements, for health checks + provenance. */
export interface IntegrationAdapter {
  readonly capability: IntegrationCapability
  /** Human-readable provider name, e.g. 'DigiLocker (mock)'. */
  readonly provider: string
  /** Whether this adapter is a mock (Phase 1) or a live integration. */
  readonly mode: 'mock' | 'live'
  healthCheck(): Promise<{ ok: boolean; detail?: string }>
}

// ── Per-capability contracts ────────────────────────────────────────────────

export interface DigiLockerAdapter extends IntegrationAdapter {
  capability: 'digilocker'
  pullDocument(refId: string): Promise<{ id: string; fileUrl: string; verified: boolean }>
  listIssued(citizenId: string): Promise<Array<{ id: string; type: string; number: string }>>
}

export interface ParivahanAdapter extends IntegrationAdapter {
  capability: 'parivahan'
  verifyLicence(dlNumber: string): Promise<{ valid: boolean; holder?: string; validTill?: string }>
  vehicleDetails(regNo: string): Promise<{ owner: string; model: string } | null>
}

export interface TamilNilamAdapter extends IntegrationAdapter {
  capability: 'tamilnilam'
  pattaDetails(surveyNo: string): Promise<{ owner: string; extent: string } | null>
}

export interface ServiceGatewayAdapter extends IntegrationAdapter {
  capability: 'esevai' | 'tnega'
  submitService(serviceId: string, payload: Record<string, unknown>): Promise<{ referenceNo: string }>
  serviceStatus(referenceNo: string): Promise<{ status: string }>
}

export interface AadhaarAdapter extends IntegrationAdapter {
  capability: 'aadhaar'
  requestOtp(aadhaar: string): Promise<{ txnId: string }>
  verifyOtp(txnId: string, otp: string): Promise<{ verified: boolean; kyc?: Record<string, unknown> }>
}

export interface PanAdapter extends IntegrationAdapter {
  capability: 'pan'
  verify(pan: string): Promise<{ valid: boolean; name?: string }>
}

export interface SmsAdapter extends IntegrationAdapter {
  capability: 'sms'
  send(to: string, template: string, vars: Record<string, string>): Promise<{ messageId: string }>
}

export interface EmailAdapter extends IntegrationAdapter {
  capability: 'email'
  send(to: string, subject: string, body: string): Promise<{ messageId: string }>
}

export interface PushAdapter extends IntegrationAdapter {
  capability: 'push'
  send(deviceToken: string, title: string, body: string, data?: Record<string, string>): Promise<{ messageId: string }>
}

export interface PaymentAdapter extends IntegrationAdapter {
  capability: 'payment'
  createOrder(amount: number, currency: string): Promise<{ orderId: string; payUrl: string }>
  verifyPayment(orderId: string): Promise<{ status: 'paid' | 'pending' | 'failed' }>
}

export interface MapsAdapter extends IntegrationAdapter {
  capability: 'maps'
  nearby(kind: 'hospital' | 'police' | 'esevai', lat: number, lng: number): Promise<Array<{ name: string; distanceKm: number }>>
}

export interface GeolocationAdapter extends IntegrationAdapter {
  capability: 'geolocation'
  current(): Promise<{ lat: number; lng: number; label?: string } | null>
}

export interface ESignAdapter extends IntegrationAdapter {
  capability: 'esign'
  sign(documentRef: string, signer: string): Promise<{ signatureId: string; signedAt: string }>
  verify(signatureId: string): Promise<{ valid: boolean }>
}

/** Map each capability to its adapter interface (for a typed registry). */
export interface CapabilityMap {
  digilocker: DigiLockerAdapter
  parivahan: ParivahanAdapter
  tamilnilam: TamilNilamAdapter
  esevai: ServiceGatewayAdapter
  tnega: ServiceGatewayAdapter
  aadhaar: AadhaarAdapter
  pan: PanAdapter
  sms: SmsAdapter
  email: EmailAdapter
  push: PushAdapter
  payment: PaymentAdapter
  maps: MapsAdapter
  geolocation: GeolocationAdapter
  esign: ESignAdapter
}

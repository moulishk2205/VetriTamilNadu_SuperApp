import { Injectable } from '@nestjs/common'
import type { GatewayOp } from '../gateway.types'
import { BaseMockAdapter } from './base.adapter'

/**
 * Concrete mock adapters. Each returns data shaped like the real integration so
 * the swap to a live client is invisible to callers. Add a live implementation
 * by replacing the class body and setting GATEWAY_MODE=live for that adapter.
 */

@Injectable()
export class AadhaarAdapter extends BaseMockAdapter {
  readonly key = 'aadhaar'; readonly name = 'UIDAI Aadhaar'
  protected payloadFor(op: GatewayOp, p: Record<string, unknown>) {
    if (op === 'fetch' || op === 'validate')
      return { uid: p.aadhaar ?? 'XXXX XXXX 8842', name: 'CHANDRAMOULISHWARAR K', dob: '2002-05-22', gender: 'M', address: 'Mylapore, Chennai, TN', verified: true }
    return { op }
  }
}

@Injectable()
export class DigiLockerAdapter extends BaseMockAdapter {
  readonly key = 'digilocker'; readonly name = 'DigiLocker'
  protected payloadFor(op: GatewayOp) {
    if (op === 'fetch') return { issuedDocs: [{ type: 'DrivingLicence', issuer: 'RTO Chennai', uri: 'in.gov.rto-DL' }, { type: 'RationCard', issuer: 'TNPDS' }] }
    return { note: 'DigiLocker live integration pending official onboarding' }
  }
}

@Injectable()
export class RtoAdapter extends BaseMockAdapter {
  readonly key = 'rto'; readonly name = 'Transport / RTO (Vahan-Sarathi)'
  protected payloadFor(op: GatewayOp, p: Record<string, unknown>) {
    if (op === 'fetch') return { dlNo: p.dlNo ?? 'DL-TN-2024-8842', class: 'LMV', validTill: '2029-12-31', rto: 'TN-01 Chennai (Central)' }
    return { op }
  }
}

@Injectable()
export class RevenueAdapter extends BaseMockAdapter {
  readonly key = 'revenue'; readonly name = 'Revenue Department (e-Sevai / TNeGA)'
  protected payloadFor(op: GatewayOp, p: Record<string, unknown>) {
    if (op === 'fetch') return { certType: p.certType ?? 'Income', tahsildar: 'Mylapore', jurisdiction: 'Chennai' }
    return { op }
  }
}

@Injectable()
export class MunicipalityAdapter extends BaseMockAdapter {
  readonly key = 'municipality'; readonly name = 'Greater Chennai Corporation'
  protected payloadFor(op: GatewayOp) { return { zone: 9, ward: 121, division: 'Mylapore' } }
}

@Injectable()
export class PoliceAdapter extends BaseMockAdapter {
  readonly key = 'police'; readonly name = 'TN Police (e-Challan / Verification)'
  protected payloadFor(op: GatewayOp) { return { pendingChallans: 0, verificationStatus: 'clear' } }
}

@Injectable()
export class TransportAdapter extends BaseMockAdapter {
  readonly key = 'transport'; readonly name = 'State Transport (TNSTC)'
  protected payloadFor(op: GatewayOp) { return { service: 'transport', permits: [] } }
}

@Injectable()
export class TreasuryAdapter extends BaseMockAdapter {
  readonly key = 'treasury'; readonly name = 'Treasury & Accounts (IFHRMS)'
  protected payloadFor(op: GatewayOp) { return { account: 'IFHRMS-MOCK', disbursed: true } }
}

@Injectable()
export class PaymentAdapter extends BaseMockAdapter {
  readonly key = 'payment'; readonly name = 'Payment Gateway (BharatKosh / UPI)'
  protected payloadFor(op: GatewayOp, p: Record<string, unknown>) {
    if (op === 'submit') return { txnId: `PAY-${Date.now()}`, amount: p.amount ?? 25, status: 'captured', method: 'UPI' }
    return { op }
  }
}

@Injectable()
export class CertificateAuthorityAdapter extends BaseMockAdapter {
  readonly key = 'ca'; readonly name = 'Certificate Authority (e-Sign / DSC)'
  protected payloadFor(op: GatewayOp, p: Record<string, unknown>) {
    if (op === 'submit') return { signed: true, certSerial: `DSC-${Date.now()}`, signatory: p.signatory ?? 'Tahsildar, Mylapore', algorithm: 'RSA-2048/SHA-256' }
    return { op }
  }
}

export const ALL_ADAPTERS = [
  AadhaarAdapter, DigiLockerAdapter, RtoAdapter, RevenueAdapter, MunicipalityAdapter,
  PoliceAdapter, TransportAdapter, TreasuryAdapter, PaymentAdapter, CertificateAuthorityAdapter,
]

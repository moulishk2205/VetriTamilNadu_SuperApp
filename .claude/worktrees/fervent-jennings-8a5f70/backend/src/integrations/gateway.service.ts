import { BadRequestException, Injectable } from '@nestjs/common'
import type { GatewayAdapter, GatewayOp, GatewayResult } from './gateway.types'
import {
  AadhaarAdapter, CertificateAuthorityAdapter, DigiLockerAdapter, MunicipalityAdapter,
  PaymentAdapter, PoliceAdapter, RevenueAdapter, RtoAdapter, TransportAdapter, TreasuryAdapter,
} from './adapters'

/** Registry + dispatcher for the Government Integration Layer. */
@Injectable()
export class GatewayService {
  private readonly registry = new Map<string, GatewayAdapter>()

  constructor(
    aadhaar: AadhaarAdapter, digilocker: DigiLockerAdapter, rto: RtoAdapter, revenue: RevenueAdapter,
    municipality: MunicipalityAdapter, police: PoliceAdapter, transport: TransportAdapter,
    treasury: TreasuryAdapter, payment: PaymentAdapter, ca: CertificateAuthorityAdapter,
  ) {
    for (const a of [aadhaar, digilocker, rto, revenue, municipality, police, transport, treasury, payment, ca]) {
      this.registry.set(a.key, a)
    }
  }

  list() {
    return [...this.registry.values()].map((a) => ({ key: a.key, name: a.name, mode: 'mock' }))
  }

  adapter(key: string): GatewayAdapter {
    const a = this.registry.get(key)
    if (!a) throw new BadRequestException(`Unknown gateway adapter "${key}"`)
    return a
  }

  call(key: string, op: GatewayOp, payload: Record<string, unknown>): Promise<GatewayResult> {
    const adapter = this.adapter(key)
    const fn = adapter[op] as (p: Record<string, unknown>) => Promise<GatewayResult>
    if (typeof fn !== 'function') throw new BadRequestException(`Unsupported op "${op}"`)
    return fn.call(adapter, payload)
  }
}

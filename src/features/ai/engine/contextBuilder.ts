import type { Citizen } from '@/types/models/citizen'
import type { WalletDocument } from '@/types/models/document'
import type { Scheme } from '@/types/models/scheme'
import type { AppSnapshot, CitizenContext, WalletDocSnapshot } from './types'

/**
 * Citizen Context Engine — turns raw platform state into the context every
 * reasoning step consumes. Pure function: state is INJECTED (the mock handler
 * passes the embedded db; a real backend passes its records), never fetched.
 */

interface RawApplication {
  id: string
  referenceNo: string
  serviceId: string
  serviceName: string
  status: string
  stage: string
  slaDaysRemaining: number | null
}

export interface RawState {
  citizen: Citizen
  documents: WalletDocument[]
  applications: RawApplication[]
  schemes: Scheme[]
  unreadNotifications: number
}

/** Parse 'MM/YYYY' style validity; returns null for Lifetime/Active/Valid etc. */
export function validityDate(validity: string): Date | null {
  const m = validity.match(/^(\d{2})\/(\d{4})$/)
  if (!m) return null
  return new Date(Number(m[2]), Number(m[1]) - 1 + 1, 0) // last day of that month
}

export function isExpired(validity: string, now = new Date()): boolean {
  const d = validityDate(validity)
  return d !== null && d < now
}

function ageFrom(dob: string): number | null {
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
}

export function buildContext(raw: RawState, now = new Date()): CitizenContext {
  const wallet: WalletDocSnapshot[] = raw.documents.map((d) => ({
    id: d.id,
    name: d.name,
    number: d.number,
    validity: d.validity,
    expired: isExpired(d.validity, now),
  }))

  const applications: AppSnapshot[] = raw.applications.map((a) => ({
    id: a.id,
    referenceNo: a.referenceNo,
    serviceId: a.serviceId,
    serviceName: a.serviceName,
    status: a.status,
    stage: a.stage,
    slaDaysRemaining: a.slaDaysRemaining,
  }))

  return {
    citizen: raw.citizen,
    age: ageFrom(raw.citizen.dob),
    district: raw.citizen.district,
    wallet,
    applications,
    schemes: raw.schemes,
    pendingCorrections: applications.filter((a) => a.stage === 'correctionRequested').length,
    unreadNotifications: raw.unreadNotifications,
  }
}

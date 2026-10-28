import type { WalletDocument } from '@/types/models/document'
import type { AppNotification } from '@/types/models/notification'
import type { ServiceCatalogItem, ServiceCategory } from '@/types/models/service'
import type { Scheme } from '@/types/models/scheme'
import type { Citizen } from '@/types/models/citizen'
import { SCHEMES_2026, FEATURED_SCHEME } from '@/features/schemes/catalog/schemes2026'

/**
 * In-memory seed database for the MSW mock backend.
 *
 * Values are copied verbatim from the prototype's inline arrays so that once a
 * screen reads from the API instead of a local constant, it renders identically.
 * Icons and theme colors are stored as *names/keys* (backend-friendly strings)
 * and resolved to components/palette values in the view adapters.
 */

export const documents: WalletDocument[] = [
  { id: 'doc_dl', name: 'Driving License', type: 'Transport', number: 'DL-TN-2024-8842', issuer: 'RTO Chennai', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: '12/2029', status: 'verified', color: '#2563EB', version: 1 },
  { id: 'doc_bc', name: 'Birth Certificate', type: 'Civil', number: 'BC-TN-2002-4421', issuer: 'GCC', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: 'Lifetime', status: 'verified', color: '#7C3AED', version: 1 },
  { id: 'doc_ic', name: 'Income Certificate', type: 'Revenue', number: 'IC-TN-2024-9912', issuer: 'Revenue Dept', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: '03/2025', status: 'verified', color: '#059669', version: 1 },
  { id: 'doc_rc', name: 'Ration Card', type: 'Civil Supplies', number: 'RC-TN-CHN-7788', issuer: 'Civil Supplies', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: 'Active', status: 'verified', color: '#059669', version: 1 },
]

export const notifications: AppNotification[] = [
  { id: 'ntf_1', title: 'Birth Certificate Approved', body: 'Your application APP-2026-BC-1123 has been approved. Download from wallet.', category: 'application', priority: 'high', read: false, createdAt: '2026-07-07T07:00:00Z', timeLabel: '2 hours ago', icon: 'CheckCircle', color: 'ok', actionPath: '/wallet' },
  { id: 'ntf_2', title: 'Complaint Assigned', body: 'CMP-TN-000452 assigned to GCC Zone 9 officer.', category: 'complaint', priority: 'normal', read: false, createdAt: '2026-07-07T04:00:00Z', timeLabel: '5 hours ago', icon: 'AlertTriangle', color: 'warn', actionPath: '/tracker' },
  { id: 'ntf_3', title: 'New Welfare Scheme Available', body: `${FEATURED_SCHEME.name} - you may be eligible for ${FEATURED_SCHEME.benefit}.`, category: 'scheme', priority: 'normal', read: true, createdAt: '2026-07-06T09:00:00Z', timeLabel: '1 day ago', icon: 'Sparkles', color: 'info', actionPath: '/schemes' },
  { id: 'ntf_4', title: 'Service Deadline Tomorrow', body: 'Income Certificate APP-2026-IC-44821 deadline is June 21.', category: 'reminder', priority: 'high', read: true, createdAt: '2026-07-06T08:00:00Z', timeLabel: '1 day ago', icon: 'Clock', color: 'err', actionPath: '/tracker' },
  { id: 'ntf_5', title: 'Document Verified', body: 'Your Community Certificate has been verified by DigiLocker.', category: 'document', priority: 'normal', read: true, createdAt: '2026-07-04T09:00:00Z', timeLabel: '3 days ago', icon: 'FileCheck', color: 'ok', actionPath: '/wallet' },
  { id: 'ntf_6', title: 'Rate Your Experience', body: 'How was your experience with the Birth Certificate service?', category: 'system', priority: 'low', read: true, createdAt: '2026-07-02T09:00:00Z', timeLabel: '5 days ago', icon: 'Star', color: 'sec' },
]

export const serviceCategories: ServiceCategory[] = [
  { id: 'all', label: 'All' },
  { id: 'cert', label: 'Certificates' },
  { id: 'trans', label: 'Transport' },
  { id: 'rev', label: 'Revenue' },
  { id: 'wel', label: 'Welfare' },
  { id: 'health', label: 'Healthcare' },
  { id: 'edu', label: 'Education' },
  { id: 'civic', label: 'Municipal' },
]

export const services: ServiceCatalogItem[] = [
  { id: 'svc_birth', name: 'Birth Certificate', category: 'cert', processingTime: '3d', fee: 'Free', popular: true, icon: 'FileCheck' },
  { id: 'svc_income', name: 'Income Certificate', category: 'cert', processingTime: '7d', fee: 'Rs.25', popular: true, icon: 'IndianRupee' },
  { id: 'svc_community', name: 'Community Certificate', category: 'cert', processingTime: '7d', fee: 'Rs.25', popular: false, icon: 'Users' },
  { id: 'svc_dl', name: 'Driving License', category: 'trans', processingTime: '15d', fee: 'Rs.200', popular: true, icon: 'Car' },
  { id: 'svc_vehreg', name: 'Vehicle Registration', category: 'trans', processingTime: '7d', fee: 'Varies', popular: false, icon: 'Car' },
  { id: 'svc_patta', name: 'Patta Transfer', category: 'rev', processingTime: '30d', fee: 'Rs.100', popular: false, icon: 'Scale' },
  { id: 'svc_pension', name: 'Old Age Pension', category: 'wel', processingTime: '30d', fee: 'Free', popular: false, icon: 'Users' },
  { id: 'svc_hospital', name: 'Hospital Appointment', category: 'health', processingTime: 'Same day', fee: 'Free', popular: false, icon: 'HeartPulse' },
  { id: 'svc_school', name: 'School Admission', category: 'edu', processingTime: 'Varies', fee: 'Free', popular: false, icon: 'GraduationCap' },
]

/** Welfare schemes — the 2026 catalogue is the single source of truth. */
export const schemes: Scheme[] = SCHEMES_2026

export const citizen: Citizen = {
  id: 'ctz_chandy',
  citizenId: 'TN-2024-XXXX-8842',
  fullName: 'Chandramoulishwarar K',
  dob: '22 May 2002',
  gender: 'Male',
  mobile: '+91 98XXX XXXXX',
  email: 'chandy@email.com',
  aadhaarMasked: 'XXXX XXXX 8842',
  district: 'Chennai',
  taluk: 'Mylapore',
  state: 'Tamil Nadu',
  verified: true,
  verifiedVia: ['Aadhaar', 'DigiLocker'],
  addresses: [
    { id: 'addr_cur', kind: 'current', line: '12/3, TTK Road, Alwarpet', area: 'Mylapore', district: 'Chennai', state: 'Tamil Nadu', pincode: '600018' },
    { id: 'addr_perm', kind: 'permanent', line: '45, Gandhi Nagar', area: 'Srirangam', district: 'Tiruchirappalli', state: 'Tamil Nadu', pincode: '620006' },
  ],
  family: [],
}

/** Aggregate DB object handlers mutate/read. */
export const db = { documents, notifications, serviceCategories, services, schemes, citizen }
export type MockDb = typeof db

import type { FormDefinition } from '@/lib/forms/types'
import { districtOptions } from './geo'

/**
 * Form Engine definitions for every flagship service. Fields + documents mirror
 * the official TN application forms (e-Sevai / TNREGINET / Parivahan / TNPDS /
 * TamilNilam). Document formats + max sizes are the verified portal constraints.
 * These are pure data — the single FormRenderer drives them all.
 */

const opts = (arr: string[]) => arr.map((v) => ({ value: v, label: v }))

const addressSection = {
  id: 'address',
  title: 'Address',
  fields: [
    { id: 'addressLine', type: 'text' as const, label: 'Address Line', validation: { required: true, minLength: 3 } },
    { id: 'district', type: 'select' as const, label: 'District', options: districtOptions(), validation: { required: true } },
    { id: 'taluk', type: 'text' as const, label: 'Taluk', validation: { required: true } },
    { id: 'pincode', type: 'text' as const, label: 'Pincode', validation: { required: true, pattern: '^\\d{6}$', message: 'Enter a 6-digit pincode' } },
  ],
}

// Common document constraints (official e-Sevai standard).
const PHOTO = { acceptedFormats: ['jpeg', 'png'], maxSizeKB: 50 }
const DOC = { acceptedFormats: ['pdf', 'jpeg'], maxSizeKB: 200 }
const PDF = { acceptedFormats: ['pdf'], maxSizeKB: 500 }

export const FORMS: Record<string, FormDefinition> = {
  form_income: {
    id: 'form_income', serviceId: 'svc_income', title: 'Income Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'applicant', title: 'Applicant Details', fields: [
        { id: 'fullName', type: 'text', label: 'Full Name', validation: { required: true, minLength: 2 } },
        { id: 'fatherName', type: 'text', label: "Father's / Husband's Name", validation: { required: true } },
        { id: 'aadhaar', type: 'aadhaar', label: 'Aadhaar / CAN Number', validation: { required: true } },
        { id: 'mobile', type: 'tel', label: 'Mobile Number', validation: { required: true, pattern: '^\\d{10}$', message: 'Enter a 10-digit mobile number' } },
      ] },
      { id: 'income', title: 'Income Details', fields: [
        { id: 'annualIncome', type: 'number', label: 'Annual Family Income (₹)', validation: { required: true, min: 0, max: 100000000 } },
        { id: 'incomeSource', type: 'select', label: 'Primary Income Source', options: opts(['Salary', 'Business', 'Agriculture', 'Daily Wage', 'Pension', 'Other']), validation: { required: true } },
        { id: 'purpose', type: 'select', label: 'Purpose', options: opts(['Educational Concession', 'Scholarship', 'Welfare Scheme', 'Employment', 'Other']), validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'photo', label: 'Applicant Photo', required: true, source: 'upload', ...PHOTO },
      { id: 'aadhaar', label: 'Aadhaar / Govt ID', required: true, source: 'digilocker', ...DOC },
      { id: 'ration', label: 'Ration / Smart Card', required: true, source: 'digilocker', ...DOC },
      { id: 'incomeProof', label: 'Income Proof (Salary slip / IT return / PAN)', required: true, source: 'upload', ...DOC },
      { id: 'selfDeclaration', label: 'Self-Declaration (auto-generated)', required: true, source: 'upload', ...PDF },
    ],
  },

  form_community: {
    id: 'form_community', serviceId: 'svc_community', title: 'Community Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'applicant', title: 'Applicant Details', fields: [
        { id: 'fullName', type: 'text', label: 'Full Name', validation: { required: true, minLength: 2 } },
        { id: 'fatherName', type: 'text', label: "Father's Name", validation: { required: true } },
        { id: 'aadhaar', type: 'aadhaar', label: 'Aadhaar Number', validation: { required: true } },
        { id: 'dob', type: 'date', label: 'Date of Birth', validation: { required: true } },
      ] },
      { id: 'community', title: 'Community Details', fields: [
        { id: 'community', type: 'select', label: 'Community', options: opts(['SC', 'ST', 'BC', 'BC (Muslim)', 'MBC', 'DNC']), validation: { required: true } },
        { id: 'subCaste', type: 'text', label: 'Sub-caste / Caste Name', validation: { required: true } },
        { id: 'religion', type: 'select', label: 'Religion', options: opts(['Hindu', 'Muslim', 'Christian', 'Other']), validation: { required: true } },
        { id: 'proofType', type: 'radio', label: 'Community Proof Source', options: opts(["Parent's Certificate", 'School Transfer Certificate']), validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'photo', label: 'Applicant Photo', required: true, source: 'upload', ...PHOTO },
      { id: 'aadhaar', label: 'Aadhaar / Govt ID', required: true, source: 'digilocker', ...DOC },
      { id: 'ration', label: 'Ration / Smart Card', required: true, source: 'digilocker', ...DOC },
      { id: 'parentCert', label: "Parent / Sibling Community Certificate", required: false, source: 'upload', appliesWhen: "If proof source is Parent's Certificate", ...DOC },
      { id: 'schoolTC', label: 'School Transfer Certificate (states community)', required: false, source: 'upload', appliesWhen: 'Alternative if parent certificate unavailable', ...DOC },
      { id: 'selfDeclaration', label: 'Self-Declaration (auto-generated)', required: true, source: 'upload', ...PDF },
    ],
  },

  form_birth: {
    id: 'form_birth', serviceId: 'svc_birth', title: 'Birth Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'registration', title: 'Registration Type', fields: [
        { id: 'registrationType', type: 'select', label: 'Registration Type', options: opts(['Standard (within 21 days)', 'Late (21–30 days)', 'Late (30 days–1 year)', 'Late (beyond 1 year)']), validation: { required: true } },
        { id: 'rchId', type: 'text', label: 'RCH / PICME ID', placeholder: 'From the mother’s PICME record', validation: { required: true } },
      ] },
      { id: 'child', title: 'Child Details', fields: [
        { id: 'childName', type: 'text', label: 'Child Name (if named)', placeholder: 'May be added later' },
        { id: 'dob', type: 'date', label: 'Date of Birth', validation: { required: true } },
        { id: 'gender', type: 'radio', label: 'Gender', options: opts(['Male', 'Female', 'Other']), validation: { required: true } },
        { id: 'placeOfBirth', type: 'select', label: 'Place of Birth', options: opts(['Hospital', 'Home', 'Other']), validation: { required: true } },
        { id: 'hospitalName', type: 'text', label: 'Hospital / Institution Name', visibleWhen: { field: 'placeOfBirth', equals: 'Hospital' }, validation: { required: true } },
      ] },
      { id: 'parents', title: 'Parent Details', fields: [
        { id: 'fatherName', type: 'text', label: "Father's Name", validation: { required: true } },
        { id: 'motherName', type: 'text', label: "Mother's Name", validation: { required: true } },
        { id: 'parentAadhaar', type: 'aadhaar', label: "Father's / Mother's Aadhaar", validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'rch', label: 'RCH / PICME record', required: true, source: 'upload', appliesWhen: 'New registration', ...DOC },
      { id: 'birthReport', label: 'Hospital Discharge / Birth Report', required: true, source: 'upload', ...DOC },
      { id: 'parentAadhaar', label: "Parents' Aadhaar", required: true, source: 'digilocker', ...DOC },
      { id: 'nonAvail', label: 'Non-Availability Certificate', required: false, source: 'upload', appliesWhen: 'Late registration beyond 1 year', ...DOC },
      { id: 'magistrateOrder', label: 'Magistrate / RDO Order', required: false, source: 'upload', appliesWhen: 'Late registration beyond 1 year', ...DOC },
    ],
  },

  form_death: {
    id: 'form_death', serviceId: 'svc_death', title: 'Death Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'registration', title: 'Registration Type', fields: [
        { id: 'registrationType', type: 'select', label: 'Registration Type', options: opts(['Standard (within 21 days)', 'Late (21–30 days)', 'Late (30 days–1 year)', 'Late (beyond 1 year)']), validation: { required: true } },
      ] },
      { id: 'deceased', title: 'Deceased Details', fields: [
        { id: 'deceasedName', type: 'text', label: 'Name of Deceased', validation: { required: true } },
        { id: 'dateOfDeath', type: 'date', label: 'Date of Death', validation: { required: true } },
        { id: 'gender', type: 'radio', label: 'Gender', options: opts(['Male', 'Female', 'Other']), validation: { required: true } },
        { id: 'placeOfDeath', type: 'select', label: 'Place of Death', options: opts(['Hospital', 'Home', 'Other']), validation: { required: true } },
      ] },
      { id: 'applicant', title: 'Informant / Applicant', fields: [
        { id: 'applicantName', type: 'text', label: 'Your Name', validation: { required: true } },
        { id: 'relationship', type: 'select', label: 'Relationship to Deceased', options: opts(['Son', 'Daughter', 'Spouse', 'Parent', 'Sibling', 'Other']), validation: { required: true } },
        { id: 'mobile', type: 'tel', label: 'Mobile Number', validation: { required: true, pattern: '^\\d{10}$', message: 'Enter a 10-digit mobile number' } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'form4', label: 'Form 4 — Medical Certificate of Cause of Death', required: true, source: 'upload', ...DOC },
      { id: 'deceasedAadhaar', label: "Deceased's Aadhaar", required: true, source: 'upload', ...DOC },
      { id: 'informantId', label: 'Informant ID + Relationship Proof', required: true, source: 'digilocker', ...DOC },
      { id: 'magistrateOrder', label: 'Magistrate / RDO Order', required: false, source: 'upload', appliesWhen: 'Late registration beyond 1 year', ...DOC },
    ],
  },

  form_marriage: {
    id: 'form_marriage', serviceId: 'svc_marriage', title: 'Marriage Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'act', title: 'Applicable Act', fields: [
        { id: 'marriageAct', type: 'select', label: 'Registration under', options: opts(['Hindu Marriage Act 1955', 'Special Marriage Act 1954', 'TN Registration of Marriages Act 2009']), validation: { required: true } },
      ] },
      { id: 'couple', title: 'Couple Details', fields: [
        { id: 'groomName', type: 'text', label: "Groom's Name", validation: { required: true } },
        { id: 'groomAge', type: 'number', label: "Groom's Age", validation: { required: true, min: 21, max: 120, message: 'Groom must be 21+' } },
        { id: 'brideName', type: 'text', label: "Bride's Name", validation: { required: true } },
        { id: 'brideAge', type: 'number', label: "Bride's Age", validation: { required: true, min: 18, max: 120, message: 'Bride must be 18+' } },
      ] },
      { id: 'marriage', title: 'Marriage Details', fields: [
        { id: 'marriageDate', type: 'date', label: 'Date of Marriage', validation: { required: true } },
        { id: 'marriagePlace', type: 'text', label: 'Place of Marriage', validation: { required: true } },
        { id: 'witness1', type: 'text', label: 'Witness 1 Name', validation: { required: true } },
        { id: 'witness2', type: 'text', label: 'Witness 2 Name', validation: { required: true } },
        { id: 'witness3', type: 'text', label: 'Witness 3 Name (SMA requires 3)', visibleWhen: { field: 'marriageAct', equals: 'Special Marriage Act 1954' }, validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'ageProof', label: 'Age Proof of both spouses (SSLC / Birth Cert)', required: true, source: 'upload', ...DOC },
      { id: 'addressProof', label: 'Address Proof (Voter ID / Aadhaar / Passport)', required: true, source: 'digilocker', ...DOC },
      { id: 'marriageProof', label: 'Marriage Proof (invite / temple cert / photos)', required: false, source: 'upload', appliesWhen: 'HMA / TN Act', ...DOC },
      { id: 'photo', label: 'Joint Photograph', required: true, source: 'upload', ...PHOTO },
      { id: 'affidavit', label: 'Affidavit (notarised — bring original to SRO)', required: true, source: 'upload', ...PDF },
    ],
  },

  form_dl: {
    id: 'form_dl', serviceId: 'svc_dl', title: 'Driving Licence Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'type', title: 'Licence Type', fields: [
        { id: 'licenceType', type: 'select', label: 'Application Type', options: opts(['Learner Licence (LLR)', 'Permanent Driving Licence', 'Renewal', 'Duplicate', 'Address Change', 'International Driving Permit']), validation: { required: true } },
        { id: 'vehicleClass', type: 'select', label: 'Vehicle Class', options: opts(['Two-Wheeler (Gearless)', 'Two-Wheeler (Geared)', 'LMV (Car)', 'Transport Vehicle']), validation: { required: true } },
      ] },
      { id: 'applicant', title: 'Applicant Details', fields: [
        { id: 'fullName', type: 'text', label: 'Full Name', validation: { required: true } },
        { id: 'dob', type: 'date', label: 'Date of Birth', validation: { required: true } },
        { id: 'bloodGroup', type: 'select', label: 'Blood Group', options: opts(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']) },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'ageAddress', label: 'Age & Address Proof (Aadhaar preferred, eKYC)', required: true, source: 'digilocker', ...DOC },
      { id: 'photo', label: 'Passport Photograph', required: true, source: 'upload', ...PHOTO },
      { id: 'form1a', label: 'Form 1A — Medical Certificate', required: false, source: 'upload', appliesWhen: 'Age > 40 or transport licence', ...DOC },
      { id: 'form9', label: 'Form 9 — Renewal Application', required: false, source: 'upload', appliesWhen: 'Renewal', ...PDF },
      { id: 'formLLD', label: 'Form LLD — Duplicate Application', required: false, source: 'upload', appliesWhen: 'Duplicate', ...PDF },
    ],
  },

  form_ration: {
    id: 'form_ration', serviceId: 'svc_ration', title: 'Ration Card Request', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'request', title: 'Request Type', fields: [
        { id: 'requestType', type: 'select', label: 'Request Type', options: opts(['New Family Card', 'Member Addition', 'Member Removal', 'Address Change', 'Duplicate / Replacement']), validation: { required: true } },
        { id: 'cardType', type: 'select', label: 'Card Type', options: opts(['Rice (PHH)', 'No-Commodity', 'Sugar', 'AAY']) },
      ] },
      { id: 'family', title: 'Family Details', fields: [
        { id: 'headName', type: 'text', label: 'Head of Family', validation: { required: true } },
        { id: 'aadhaar', type: 'aadhaar', label: 'Head Aadhaar', validation: { required: true } },
        { id: 'memberCount', type: 'number', label: 'Number of Members', validation: { required: true, min: 1, max: 30 } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'photo', label: 'Head of Family Photo (5×3.5 cm)', required: true, source: 'upload', ...PHOTO },
      { id: 'aadhaarAll', label: 'Aadhaar of all family members', required: true, source: 'digilocker', ...DOC },
      { id: 'residence', label: 'Residence Proof (EB bill / property tax / rent)', required: true, source: 'upload', ...DOC },
      { id: 'surrender', label: 'Surrender Certificate', required: false, source: 'upload', appliesWhen: 'If migrating from an existing family card', ...DOC },
    ],
  },

  form_patta: {
    id: 'form_patta', serviceId: 'svc_patta', title: 'Patta Transfer Request', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'transfer', title: 'Transfer Type', fields: [
        { id: 'transferType', type: 'select', label: 'Transfer Type', options: opts(['Full Field Transfer', 'Joint Patta Transfer', 'Subdivision', 'Correction', 'A-Register Extract', 'Chitta Extract']), validation: { required: true } },
      ] },
      { id: 'land', title: 'Land Details', fields: [
        { id: 'surveyNumber', type: 'text', label: 'Survey Number', validation: { required: true } },
        { id: 'village', type: 'text', label: 'Village', validation: { required: true } },
        { id: 'extent', type: 'text', label: 'Extent (acres / hectares)', validation: { required: true } },
        { id: 'currentOwner', type: 'text', label: 'Current Owner', validation: { required: true } },
        { id: 'newOwner', type: 'text', label: 'New Owner', validation: { required: true } },
        { id: 'inheritance', type: 'radio', label: 'Transfer via inheritance?', options: opts(['No', 'Yes']), validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'deed', label: 'Title Deed (Sale / Settlement / Will)', required: true, source: 'upload', ...DOC },
      { id: 'ec', label: 'Encumbrance Certificate (EC)', required: true, source: 'digilocker', ...DOC },
      { id: 'prevPatta', label: 'Previous Patta / Chitta', required: true, source: 'digilocker', ...DOC },
      { id: 'legalHeir', label: 'Legal Heir Certificate', required: false, source: 'upload', appliesWhen: 'If transfer is via inheritance', ...DOC },
    ],
  },

  // ─── Phase 3.5: forms for the 13 additional services ──────────────────────
  form_residence: {
    id: 'form_residence', serviceId: 'svc_residence', title: 'Residence Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'applicant', title: 'Applicant Details', fields: [
        { id: 'fullName', type: 'text', label: 'Full Name', validation: { required: true, minLength: 2 } },
        { id: 'canNumber', type: 'text', label: 'CAN Number', placeholder: 'Citizen Access Number', validation: { required: true } },
        { id: 'mobile', type: 'tel', label: 'Mobile Number', validation: { required: true, pattern: '^\\d{10}$', message: 'Enter a 10-digit mobile number' } },
      ] },
      { id: 'details', title: 'Residence Details', fields: [
        { id: 'residenceDuration', type: 'text', label: 'Duration of Residence (years)', validation: { required: true } },
        { id: 'purpose', type: 'select', label: 'Purpose', options: opts(['Educational Admission', 'Ration Card', 'Employment', 'Other']), validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'photo', label: 'Applicant Photo', required: true, source: 'upload', ...PHOTO },
      { id: 'addressProof', label: 'Address Proof (Aadhaar / Ration / Passport)', required: true, source: 'digilocker', ...DOC },
      { id: 'selfDeclaration', label: 'Self-Declaration (auto-generated)', required: true, source: 'upload', ...PDF },
    ],
  },

  form_nativity: {
    id: 'form_nativity', serviceId: 'svc_nativity', title: 'Nativity Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'applicant', title: 'Applicant Details', fields: [
        { id: 'fullName', type: 'text', label: 'Full Name', validation: { required: true, minLength: 2 } },
        { id: 'canNumber', type: 'text', label: 'CAN Number', validation: { required: true } },
        { id: 'bornInTN', type: 'radio', label: 'Were you born in Tamil Nadu?', options: opts(['Yes', 'No — claiming through parent']), validation: { required: true } },
      ] },
      { id: 'details', title: 'Nativity Details', fields: [
        { id: 'birthPlace', type: 'text', label: 'Birth Place', validation: { required: true } },
        { id: 'residenceDuration', type: 'text', label: 'Continuous Residence (years)', validation: { required: true } },
        { id: 'parentNativity', type: 'text', label: "Parent's Nativity Details", visibleWhen: { field: 'bornInTN', equals: 'No — claiming through parent' }, validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'photo', label: 'Applicant Photo', required: true, source: 'upload', ...PHOTO },
      { id: 'addressProof', label: 'Address Proof', required: true, source: 'digilocker', ...DOC },
      { id: 'birth', label: 'Birth Certificate', required: true, source: 'digilocker', ...DOC },
      { id: 'residencyProof', label: 'School / Employment Proof (5 years)', required: true, source: 'upload', ...DOC },
      { id: 'selfDeclaration', label: 'Self-Declaration (auto-generated)', required: true, source: 'upload', ...PDF },
    ],
  },

  form_legalheir: {
    id: 'form_legalheir', serviceId: 'svc_legalheir', title: 'Legal Heir Certificate Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'deceased', title: 'Deceased Details', fields: [
        { id: 'deceasedName', type: 'text', label: 'Name of Deceased', validation: { required: true } },
        { id: 'dateOfDeath', type: 'date', label: 'Date of Death', validation: { required: true } },
        { id: 'religion', type: 'select', label: 'Religion', options: opts(['Hindu', 'Muslim', 'Christian', 'Other']), validation: { required: true } },
      ] },
      { id: 'heirs', title: 'Surviving Heirs', fields: [
        { id: 'heirClass', type: 'radio', label: 'Applicant Heir Class', options: opts(['Class I (spouse/children/parents)', 'Class II (siblings/grandchildren)']), validation: { required: true } },
        { id: 'survivingHeirs', type: 'textarea', label: 'All Surviving Heirs (name · relationship · age)', placeholder: 'List every surviving heir — omission is an offence', validation: { required: true, minLength: 5 } },
        { id: 'noClassIProof', type: 'text', label: 'Proof of no Class I heirs', visibleWhen: { field: 'heirClass', equals: 'Class II (siblings/grandchildren)' }, validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'deathCert', label: 'Death Certificate', required: true, source: 'digilocker', ...DOC },
      { id: 'heirIds', label: 'ID Proofs of all heirs', required: true, source: 'upload', ...DOC },
      { id: 'rationCard', label: 'Family Ration Card', required: true, source: 'digilocker', ...DOC },
      { id: 'relationshipProof', label: 'Relationship Proofs', required: true, source: 'upload', ...DOC },
      { id: 'heirAadhaar', label: 'Aadhaar of all heirs', required: true, source: 'digilocker', ...DOC },
    ],
  },

  form_ec: {
    id: 'form_ec', serviceId: 'svc_ec', title: 'Encumbrance Certificate Query', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'property', title: 'Property Location', fields: [
        { id: 'zone', type: 'text', label: 'Zone', validation: { required: true } },
        { id: 'district', type: 'select', label: 'District', options: districtOptions(), validation: { required: true } },
        { id: 'sro', type: 'text', label: 'Sub-Registrar Office (SRO)', validation: { required: true } },
        { id: 'surveyNumber', type: 'text', label: 'Survey / Subdivision Number', validation: { required: true } },
      ] },
      { id: 'period', title: 'Search Period', fields: [
        { id: 'startDate', type: 'date', label: 'Start Date', validation: { required: true } },
        { id: 'endDate', type: 'date', label: 'End Date', validation: { required: true } },
      ] },
    ],
    documents: [
      { id: 'propertyDetails', label: 'Property Details / Deed', required: false, source: 'upload', ...DOC },
    ],
  },

  form_chitta: {
    id: 'form_chitta', serviceId: 'svc_chitta', title: 'Chitta / Patta Extract', workflowId: 'gov.standard.v1', allowDraft: false,
    sections: [
      { id: 'land', title: 'Land Location', fields: [
        { id: 'mode', type: 'select', label: 'Area Type', options: opts(['Rural', 'Urban', 'Natham']), validation: { required: true } },
        { id: 'district', type: 'select', label: 'District', options: districtOptions(), validation: { required: true } },
        { id: 'taluk', type: 'text', label: 'Taluk', validation: { required: true } },
        { id: 'village', type: 'text', label: 'Village', validation: { required: true } },
        { id: 'surveyNumber', type: 'text', label: 'Survey Number', validation: { required: true } },
        { id: 'subdivisionNumber', type: 'text', label: 'Subdivision Number' },
        { id: 'mobile', type: 'tel', label: 'Mobile (for OTP)', validation: { required: true, pattern: '^\\d{10}$', message: 'Enter a 10-digit mobile number' } },
      ] },
    ],
    documents: [],
  },

  form_adangal: {
    id: 'form_adangal', serviceId: 'svc_adangal', title: 'Adangal Extract', workflowId: 'gov.standard.v1', allowDraft: false,
    sections: [
      { id: 'land', title: 'Land Location', fields: [
        { id: 'district', type: 'select', label: 'District', options: districtOptions(), validation: { required: true } },
        { id: 'taluk', type: 'text', label: 'Taluk', validation: { required: true } },
        { id: 'village', type: 'text', label: 'Village', validation: { required: true } },
        { id: 'surveyNumber', type: 'text', label: 'Survey Number', validation: { required: true } },
        { id: 'subdivisionNumber', type: 'text', label: 'Subdivision Number' },
        { id: 'pattaNumber', type: 'text', label: 'Patta Number', validation: { required: true } },
      ] },
    ],
    documents: [],
  },

  form_fmb: {
    id: 'form_fmb', serviceId: 'svc_fmb', title: 'FMB Sketch', workflowId: 'gov.standard.v1', allowDraft: false,
    sections: [
      { id: 'land', title: 'Land Location', fields: [
        { id: 'urban', type: 'radio', label: 'Area Type', options: opts(['Rural', 'Urban']), validation: { required: true } },
        { id: 'district', type: 'select', label: 'District', options: districtOptions(), validation: { required: true } },
        { id: 'taluk', type: 'text', label: 'Taluk', validation: { required: true } },
        { id: 'village', type: 'text', label: 'Village', validation: { required: true } },
        { id: 'townWardBlock', type: 'text', label: 'Town / Ward / Block', visibleWhen: { field: 'urban', equals: 'Urban' }, validation: { required: true } },
        { id: 'surveyNumber', type: 'text', label: 'Survey Number', validation: { required: true } },
        { id: 'subdivisionNumber', type: 'text', label: 'Subdivision Number' },
      ] },
    ],
    documents: [],
  },

  form_rctransfer: {
    id: 'form_rctransfer', serviceId: 'svc_rctransfer', title: 'RC Transfer Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'vehicle', title: 'Vehicle Details', fields: [
        { id: 'registrationNumber', type: 'text', label: 'Vehicle Registration Number', validation: { required: true } },
        { id: 'chassisNumber', type: 'text', label: 'Chassis Number', validation: { required: true } },
        { id: 'hypothecated', type: 'radio', label: 'Vehicle under loan (hypothecated)?', options: opts(['No', 'Yes']), validation: { required: true } },
      ] },
      { id: 'buyer', title: 'Buyer Details', fields: [
        { id: 'buyerName', type: 'text', label: 'Buyer Name', validation: { required: true } },
        { id: 'buyerMobile', type: 'tel', label: 'Buyer Mobile', validation: { required: true, pattern: '^\\d{10}$', message: 'Enter a 10-digit mobile number' } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'form29', label: 'Form 29 — Notice of Transfer', required: true, source: 'upload', ...PDF },
      { id: 'form30', label: 'Form 30 — Report of Transfer', required: true, source: 'upload', ...PDF },
      { id: 'originalRC', label: 'Original RC', required: true, source: 'digilocker', ...DOC },
      { id: 'insurance', label: 'Valid Insurance', required: true, source: 'upload', ...DOC },
      { id: 'pucc', label: 'PUC Certificate', required: true, source: 'upload', ...DOC },
      { id: 'bankNoc', label: 'Bank NOC (Form 35)', required: false, source: 'upload', appliesWhen: 'If hypothecated', ...PDF },
    ],
  },

  form_duprc: {
    id: 'form_duprc', serviceId: 'svc_duprc', title: 'Duplicate RC Application', workflowId: 'gov.standard.v1', allowDraft: true,
    sections: [
      { id: 'vehicle', title: 'Vehicle Details', fields: [
        { id: 'registrationNumber', type: 'text', label: 'Registration Number', validation: { required: true } },
        { id: 'chassisLast5', type: 'text', label: 'Last 5 Digits of Chassis', validation: { required: true, minLength: 5, maxLength: 5 } },
        { id: 'reason', type: 'select', label: 'Reason for Duplicate', options: opts(['Lost', 'Stolen', 'Damaged']), validation: { required: true } },
        { id: 'firNumber', type: 'text', label: 'Police FIR Number', visibleWhen: { field: 'reason', equals: 'Stolen' }, validation: { required: true } },
      ] },
      addressSection,
    ],
    documents: [
      { id: 'form26', label: 'Form 26', required: true, source: 'upload', ...PDF },
      { id: 'fir', label: 'Police FIR / Non-Traceable Certificate', required: false, source: 'upload', appliesWhen: 'If lost or stolen', ...DOC },
      { id: 'insurance', label: 'Valid Insurance', required: true, source: 'upload', ...DOC },
      { id: 'pucc', label: 'PUC Certificate', required: true, source: 'upload', ...DOC },
      { id: 'affidavit', label: 'Affidavit (RC lost, not impounded)', required: true, source: 'upload', ...PDF },
    ],
  },

  form_mvtax: {
    id: 'form_mvtax', serviceId: 'svc_mvtax', title: 'Vehicle Tax Payment', workflowId: 'gov.standard.v1', allowDraft: false,
    sections: [
      { id: 'vehicle', title: 'Vehicle Details', fields: [
        { id: 'registrationNumber', type: 'text', label: 'Registration Number', validation: { required: true } },
        { id: 'chassisNumber', type: 'text', label: 'Chassis Number', validation: { required: true } },
      ] },
    ],
    documents: [],
  },

  form_echallan: {
    id: 'form_echallan', serviceId: 'svc_echallan', title: 'e-Challan Payment', workflowId: 'gov.standard.v1', allowDraft: false,
    sections: [
      { id: 'lookup', title: 'Challan Lookup', fields: [
        { id: 'lookupType', type: 'select', label: 'Search By', options: opts(['Vehicle Number', 'Challan Number', 'DL Number']), validation: { required: true } },
        { id: 'lookupValue', type: 'text', label: 'Number', validation: { required: true } },
        { id: 'engineChassisLast5', type: 'text', label: 'Engine / Chassis (last 5 digits)', validation: { required: true, minLength: 5, maxLength: 5 } },
      ] },
    ],
    documents: [],
  },

  form_proptax: {
    id: 'form_proptax', serviceId: 'svc_proptax', title: 'Property Tax Payment', workflowId: 'gov.standard.v1', allowDraft: false,
    sections: [
      { id: 'property', title: 'Property Assessment', fields: [
        { id: 'zoneNumber', type: 'text', label: 'Zone Number', validation: { required: true } },
        { id: 'wardCode', type: 'text', label: 'Ward / Division Code', validation: { required: true } },
        { id: 'billNumber', type: 'text', label: 'Bill Number', validation: { required: true } },
        { id: 'subNumber', type: 'text', label: 'Sub Number' },
      ] },
    ],
    documents: [],
  },

  form_water: {
    id: 'form_water', serviceId: 'svc_water', title: 'Water Charges Payment', workflowId: 'gov.standard.v1', allowDraft: false,
    sections: [
      { id: 'consumer', title: 'Consumer Details', fields: [
        { id: 'consumerNumber', type: 'text', label: 'Consumer Number (CMC)', validation: { required: true } },
        { id: 'area', type: 'text', label: 'Area', validation: { required: true } },
        { id: 'division', type: 'text', label: 'Division', validation: { required: true } },
        { id: 'billNumber', type: 'text', label: 'Bill Number' },
      ] },
    ],
    documents: [],
  },
}

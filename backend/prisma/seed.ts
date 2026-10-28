/* eslint-disable no-console */
import {
  ApplicationStage, ComplaintStatus, PrismaClient, Priority, VerificationStatus,
} from '@prisma/client'

const prisma = new PrismaClient()

/* ------------------------------------------------------------------ helpers */
const pick = <T>(arr: T[], i: number): T => arr[i % arr.length]
const rand = (n: number) => Math.floor(Math.random() * n)
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000)

/* ------------------------------------------------------------- reference data */
// All 38 Tamil Nadu districts (real). Taluks/villages generated per district.
const TN_DISTRICTS = [
  'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kanchipuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Salem', 'Sivaganga', 'Thanjavur', 'Theni',
  'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai',
  'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar', 'Ariyalur', 'Chengalpattu', 'Kallakurichi',
  'Ranipet', 'Tenkasi', 'Tirupathur', 'Mayiladuthurai',
]
const CHENNAI_TALUKS = ['Mylapore', 'Egmore', 'Guindy', 'Ambattur', 'Perambur', 'Sholinganallur']

const DEPARTMENTS = [
  'Revenue & Disaster Management', 'Civil Supplies & Consumer Protection', 'Transport',
  'Municipal Administration & Water Supply', 'Greater Chennai Corporation', 'Health & Family Welfare',
  'School Education', 'Higher Education', 'Social Welfare', 'Agriculture', 'Registration',
  'Rural Development & Panchayat Raj', 'Labour & Employment', 'Housing & Urban Development',
  'Adi Dravidar & Tribal Welfare', 'Backward Classes Welfare', 'Handlooms & Textiles',
  'Environment & Forests', 'Public Works', 'Electricity (TANGEDCO)',
]

const CATEGORIES = [
  { code: 'all', label: 'All' }, { code: 'cert', label: 'Certificates' }, { code: 'trans', label: 'Transport' },
  { code: 'rev', label: 'Revenue' }, { code: 'wel', label: 'Welfare' }, { code: 'health', label: 'Healthcare' },
  { code: 'edu', label: 'Education' }, { code: 'civic', label: 'Municipal' },
]

// Flagship services (real TN e-Sevai catalogue). metadata carries UI hints.
const SERVICES = [
  { slug: 'svc_birth', code: 'CIV-BC', name: 'Birth Certificate', cat: 'cert', dept: 'Greater Chennai Corporation', fee: 'Free', time: '3d', validity: 'Lifetime', produces: 'Birth Certificate', icon: 'FileCheck', popular: true },
  { slug: 'svc_death', code: 'CIV-DC', name: 'Death Certificate', cat: 'cert', dept: 'Greater Chennai Corporation', fee: 'Free', time: '3d', validity: 'Lifetime', produces: 'Death Certificate', icon: 'FileText', popular: false },
  { slug: 'svc_income', code: 'REV-IC', name: 'Income Certificate', cat: 'cert', dept: 'Revenue & Disaster Management', fee: 'Rs.60', time: '15d', validity: '1 year', produces: 'Income Certificate', icon: 'IndianRupee', popular: true },
  { slug: 'svc_community', code: 'REV-CC', name: 'Community Certificate', cat: 'cert', dept: 'Revenue & Disaster Management', fee: 'Rs.60', time: '30d', validity: 'Lifetime', produces: 'Community Certificate', icon: 'Users', popular: true },
  { slug: 'svc_nativity', code: 'REV-NAT', name: 'Nativity Certificate', cat: 'cert', dept: 'Revenue & Disaster Management', fee: 'Rs.60', time: '15d', validity: 'Lifetime', produces: 'Nativity Certificate', icon: 'MapPin', popular: false },
  { slug: 'svc_residence', code: 'REV-RES', name: 'Residence Certificate', cat: 'cert', dept: 'Revenue & Disaster Management', fee: 'Rs.60', time: '15d', validity: '6 months', produces: 'Residence Certificate', icon: 'Home', popular: false },
  { slug: 'svc_legalheir', code: 'REV-LH', name: 'Legal Heir Certificate', cat: 'cert', dept: 'Revenue & Disaster Management', fee: 'Rs.60', time: '30d', validity: 'Lifetime', produces: 'Legal Heir Certificate', icon: 'Scale', popular: false },
  { slug: 'svc_marriage', code: 'REG-MC', name: 'Marriage Certificate', cat: 'cert', dept: 'Registration', fee: 'Rs.100', time: '15d', validity: 'Lifetime', produces: 'Marriage Certificate', icon: 'Heart', popular: false },
  { slug: 'svc_dl', code: 'TRN-DL', name: 'Driving Licence', cat: 'trans', dept: 'Transport', fee: 'Rs.200', time: '15d', validity: '20 years', produces: 'Driving Licence', icon: 'Car', popular: true },
  { slug: 'svc_rctransfer', code: 'TRN-RCT', name: 'RC Transfer', cat: 'trans', dept: 'Transport', fee: 'Rs.500', time: '30d', validity: 'NA', produces: 'RC Book', icon: 'Car', popular: false },
  { slug: 'svc_duprc', code: 'TRN-DRC', name: 'Duplicate RC', cat: 'trans', dept: 'Transport', fee: 'Rs.300', time: '15d', validity: 'NA', produces: 'RC Book', icon: 'Car', popular: false },
  { slug: 'svc_mvtax', code: 'TRN-MVT', name: 'Motor Vehicle Tax', cat: 'trans', dept: 'Transport', fee: 'Varies', time: 'Same day', validity: '1 year', produces: null, icon: 'IndianRupee', popular: false },
  { slug: 'svc_patta', code: 'REV-PT', name: 'Patta Transfer', cat: 'rev', dept: 'Revenue & Disaster Management', fee: 'Rs.100', time: '30d', validity: 'NA', produces: 'Patta', icon: 'Scale', popular: false },
  { slug: 'svc_ec', code: 'REG-EC', name: 'Encumbrance Certificate', cat: 'rev', dept: 'Registration', fee: 'Rs.100', time: '7d', validity: 'NA', produces: 'EC', icon: 'FileText', popular: false },
  { slug: 'svc_chitta', code: 'REV-CHT', name: 'Chitta / Adangal', cat: 'rev', dept: 'Revenue & Disaster Management', fee: 'Rs.100', time: '7d', validity: 'NA', produces: 'Chitta', icon: 'FileText', popular: false },
  { slug: 'svc_ration', code: 'CS-RC', name: 'Ration Card', cat: 'wel', dept: 'Civil Supplies & Consumer Protection', fee: 'Free', time: '30d', validity: 'NA', produces: 'Ration Card', icon: 'CreditCard', popular: true },
  { slug: 'svc_pension', code: 'SW-OAP', name: 'Old Age Pension', cat: 'wel', dept: 'Social Welfare', fee: 'Free', time: '30d', validity: 'NA', produces: null, icon: 'Users', popular: false },
  { slug: 'svc_proptax', code: 'MUN-PTX', name: 'Property Tax Payment', cat: 'civic', dept: 'Greater Chennai Corporation', fee: 'Varies', time: 'Same day', validity: 'NA', produces: null, icon: 'Home', popular: false },
  { slug: 'svc_water', code: 'MUN-WTR', name: 'Water Tax / New Connection', cat: 'civic', dept: 'Municipal Administration & Water Supply', fee: 'Varies', time: '15d', validity: 'NA', produces: null, icon: 'Droplet', popular: false },
  { slug: 'svc_hospital', code: 'HL-APPT', name: 'Hospital Appointment', cat: 'health', dept: 'Health & Family Welfare', fee: 'Free', time: 'Same day', validity: 'NA', produces: null, icon: 'HeartPulse', popular: false },
]

// CANONICAL 2026 welfare catalogue — mirrors
// src/features/schemes/catalog/schemes2026.ts (separate package, cannot import
// from the frontend). This is the ONLY scheme data seeded: no padding, no
// generated placeholders. Keep both files in sync.
const SCHEMES = [
  { name: 'PM Kisan Samman Nidhi', nameTamil: '\u0baa\u0bbf\u0bb0\u0ba4\u0bae \u0bae\u0ba8\u0bcd\u0ba4\u0bbf\u0bb0\u0bbf \u0b95\u0bbf\u0b9a\u0bbe\u0ba9\u0bcd \u0b9a\u0bae\u0bcd\u0bae\u0bbe\u0ba9\u0bcd \u0ba8\u0bbf\u0ba4\u0bbf', dept: 'Agriculture', benefit: '\u20b96,000 per year', benefitTamil: '\u0b86\u0ba3\u0bcd\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u20b96,000', budget: null, score: 95, color: '#0F766E', incomeMax: 300000, purpose: 'Income support for land-holding farmer families (Government of India).' },
  { name: 'Annanin Seer Scheme', nameTamil: '\u0b85\u0ba3\u0bcd\u0ba3\u0ba9\u0bbf\u0ba9\u0bcd \u0b9a\u0bc0\u0bb0\u0bcd \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'Social Welfare & Women Empowerment', benefit: '8 g gold coin + silk saree', benefitTamil: '8 \u0b95\u0bbf\u0bb0\u0bbe\u0bae\u0bcd \u0ba4\u0b99\u0bcd\u0b95 \u0ba8\u0bbe\u0ba3\u0baf\u0bae\u0bcd + \u0baa\u0b9f\u0bcd\u0b9f\u0bc1\u0baa\u0bcd \u0baa\u0bc1\u0b9f\u0bb5\u0bc8', budget: '\u20b9812 Crore', score: 92, color: '#DB2777', incomeMax: 250000, purpose: 'Marriage assistance for eligible brides.' },
  { name: 'Thai Maaman Thanga Modhiram Scheme', nameTamil: '\u0ba4\u0bbe\u0baf\u0bcd \u0bae\u0bbe\u0bae\u0ba9\u0bcd \u0ba4\u0b99\u0bcd\u0b95 \u0bae\u0bcb\u0ba4\u0bbf\u0bb0\u0bae\u0bcd \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'Health & Family Welfare', benefit: '1 g gold ring for every baby born in a Government hospital', benefitTamil: '\u0b85\u0bb0\u0b9a\u0bc1 \u0bae\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1\u0bb5\u0bae\u0ba9\u0bc8\u0baf\u0bbf\u0bb2\u0bcd \u0baa\u0bbf\u0bb1\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd \u0b92\u0bb5\u0bcd\u0bb5\u0bc6\u0bbe\u0bb0\u0bc1 \u0b95\u0bc1\u0bb4\u0ba8\u0bcd\u0ba4\u0bc8\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd 1 \u0b95\u0bbf\u0bb0\u0bbe\u0bae\u0bcd \u0ba4\u0b99\u0bcd\u0b95 \u0bae\u0bcb\u0ba4\u0bbf\u0bb0\u0bae\u0bcd', budget: '\u20b9560 Crore', score: 88, color: '#F59E0B', incomeMax: 0, purpose: 'Every baby born in a Government hospital receives a 1 gram gold ring.' },
  { name: 'Vetri Laptop Scheme', nameTamil: '\u0bb5\u0bc6\u0bb1\u0bcd\u0bb1\u0bbf \u0bae\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0ba3\u0bbf\u0ba9\u0bbf \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'Higher Education', benefit: 'Free laptop for college students', benefitTamil: '\u0b95\u0bb2\u0bcd\u0bb2\u0bc2\u0bb0\u0bbf \u0bae\u0bbe\u0ba3\u0bb5\u0bb0\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0b87\u0bb2\u0bb5\u0b9a \u0bae\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0ba3\u0bbf\u0ba9\u0bbf', budget: '\u20b92,000 Crore', score: 85, color: '#7C3AED', incomeMax: 0, purpose: 'Free laptops for college students.' },
  { name: 'Modern Bicycle Scheme', nameTamil: '\u0ba8\u0bb5\u0bc0\u0ba9 \u0bae\u0bbf\u0ba4\u0bbf\u0bb5\u0ba3\u0bcd\u0b9f\u0bbf \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'School Education', benefit: 'Branded bicycle with helmet and bottle holder', benefitTamil: '\u0ba4\u0bb2\u0bc8\u0b95\u0bcd\u0b95\u0bb5\u0b9a\u0bae\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b95\u0bc1\u0b9f\u0bc1\u0bb5\u0bc8 \u0bb5\u0bc8\u0baa\u0bcd\u0baa\u0bbe\u0ba9\u0bc1\u0b9f\u0ba9\u0bcd \u0ba8\u0bb5\u0bc0\u0ba9 \u0bae\u0bbf\u0ba4\u0bbf\u0bb5\u0ba3\u0bcd\u0b9f\u0bbf', budget: '\u20b9777 Crore', score: 80, color: '#0891B2', incomeMax: 0, purpose: 'Free branded bicycles with helmet and bottle holder for eligible students.' },
  { name: 'Vetri Skill Training Scheme', nameTamil: '\u0bb5\u0bc6\u0bb1\u0bcd\u0bb1\u0bbf \u0ba4\u0bbf\u0bb1\u0ba9\u0bcd \u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'Labour Welfare & Skill Development', benefit: 'Industry skill training, internships and AI upskilling', benefitTamil: '\u0ba4\u0bc6\u0bbe\u0bb4\u0bbf\u0bb2\u0bcd\u0ba4\u0bc1\u0bb1\u0bc8 \u0ba4\u0bbf\u0bb1\u0ba9\u0bcd \u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd AI \u0ba4\u0bbf\u0bb1\u0ba9\u0bcd \u0bae\u0bc7\u0bae\u0bcd\u0baa\u0bbe\u0b9f\u0bc1', budget: null, score: 78, color: '#2563EB', incomeMax: 0, purpose: 'Industry-oriented skill development, internships and AI skill training - target: 5 lakh youth trained in AI by 2031.' },
  { name: 'Vetri Housing Scheme', nameTamil: '\u0bb5\u0bc6\u0bb1\u0bcd\u0bb1\u0bbf \u0bb5\u0bc0\u0b9f\u0bcd\u0b9f\u0bc1\u0bb5\u0b9a\u0ba4\u0bbf \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'Housing & Urban Development', benefit: 'Housing assistance for eligible families', benefitTamil: '\u0ba4\u0b95\u0bc1\u0ba4\u0bbf\u0baf\u0bbe\u0ba9 \u0b95\u0bc1\u0b9f\u0bc1\u0bae\u0bcd\u0baa\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0bb5\u0bc0\u0b9f\u0bcd\u0b9f\u0bc1\u0bb5\u0b9a\u0ba4\u0bbf \u0b89\u0ba4\u0bb5\u0bbf', budget: null, score: 74, color: '#059669', incomeMax: 300000, purpose: 'Housing assistance for eligible families.' },
  { name: "Vetri Women's Goat Rearing Scheme", nameTamil: '\u0bb5\u0bc6\u0bb1\u0bcd\u0bb1\u0bbf \u0bae\u0b95\u0bb3\u0bbf\u0bb0\u0bcd \u0b86\u0b9f\u0bc1 \u0bb5\u0bb3\u0bb0\u0bcd\u0baa\u0bcd\u0baa\u0bc1 \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'Animal Husbandry', benefit: 'Goat rearing support for women', benefitTamil: '\u0bae\u0b95\u0bb3\u0bbf\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0b86\u0b9f\u0bc1 \u0bb5\u0bb3\u0bb0\u0bcd\u0baa\u0bcd\u0baa\u0bc1 \u0b89\u0ba4\u0bb5\u0bbf', budget: null, score: 70, color: '#16A34A', incomeMax: 200000, purpose: 'Livelihood support for women through goat rearing.' },
  { name: 'Digital Library Initiative', nameTamil: '\u0b9f\u0bbf\u0b9c\u0bbf\u0b9f\u0bcd\u0b9f\u0bb2\u0bcd \u0ba8\u0bc2\u0bb2\u0b95\u0ba4\u0bcd \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', dept: 'School Education', benefit: 'Free digital library access for students', benefitTamil: '\u0bae\u0bbe\u0ba3\u0bb5\u0bb0\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0b87\u0bb2\u0bb5\u0b9a \u0b9f\u0bbf\u0b9c\u0bbf\u0b9f\u0bcd\u0b9f\u0bb2\u0bcd \u0ba8\u0bc2\u0bb2\u0b95 \u0b85\u0ba3\u0bc1\u0b95\u0bb2\u0bcd', budget: null, score: 66, color: '#8B5CF6', incomeMax: 0, purpose: 'Digital library access for students across Tamil Nadu.' },
]

const FIRST = ['Arun', 'Priya', 'Karthik', 'Divya', 'Suresh', 'Lakshmi', 'Vijay', 'Meena', 'Rajesh', 'Anitha', 'Bala', 'Kavya', 'Senthil', 'Deepa', 'Ganesh', 'Revathi', 'Muthu', 'Nithya', 'Ramesh', 'Shanthi']
const LAST = ['Kumar', 'Raj', 'Murugan', 'Krishnan', 'Sundaram', 'Palani', 'Natarajan', 'Selvam', 'Ramachandran', 'Subramaniam']
const COMPLAINT_CATS = ['Road Damage', 'Water Supply', 'Streetlight', 'Garbage', 'Drainage', 'Illegal Encroachment', 'Stray Animals']
const STAGES = Object.values(ApplicationStage)

async function main() {
  console.log('🌱 Seeding Vetri TN backend…')

  // The seed wipes every table, AuditLog included. Refuse to touch a database
  // that already holds data unless SEED_FORCE=true is set explicitly.
  const existing = await prisma.citizen.count()
  if (existing > 0 && process.env.SEED_FORCE !== 'true') {
    throw new Error(`Refusing to seed: database already holds ${existing} citizens. Set SEED_FORCE=true to wipe and reseed.`)
  }

  // Wipe (FK-safe order)
  await prisma.$transaction([
    prisma.aiMessage.deleteMany(), prisma.conversation.deleteMany(), prisma.payment.deleteMany(),
    prisma.attachment.deleteMany(), prisma.comment.deleteMany(), prisma.timelineEvent.deleteMany(),
    prisma.application.deleteMany(), prisma.complaint.deleteMany(), prisma.notification.deleteMany(),
    prisma.document.deleteMany(), prisma.address.deleteMany(), prisma.eligibilityRule.deleteMany(),
    prisma.scheme.deleteMany(), prisma.auditLog.deleteMany(), prisma.session.deleteMany(),
    prisma.refreshToken.deleteMany(), prisma.otp.deleteMany(), prisma.workflowStep.deleteMany(),
    prisma.workflow.deleteMany(), prisma.service.deleteMany(), prisma.serviceCategory.deleteMany(),
    prisma.officer.deleteMany(), prisma.user.deleteMany(), prisma.citizen.deleteMany(),
    prisma.village.deleteMany(), prisma.taluk.deleteMany(), prisma.district.deleteMany(),
    prisma.department.deleteMany(),
  ])

  /* geography ------------------------------------------------------------- */
  for (const dName of TN_DISTRICTS) {
    const district = await prisma.district.create({ data: { name: dName } })
    const taluks = dName === 'Chennai' ? CHENNAI_TALUKS : [`${dName} (North)`, `${dName} (South)`, `${dName} (Rural)`]
    for (const tName of taluks) {
      const taluk = await prisma.taluk.create({ data: { name: tName, districtId: district.id } })
      await prisma.village.createMany({
        data: [1, 2, 3].map((n) => ({ name: `${tName} Village ${n}`, talukId: taluk.id })),
      })
    }
  }
  console.log(`  ✓ ${TN_DISTRICTS.length} districts + taluks + villages`)

  /* departments ----------------------------------------------------------- */
  const departments = await Promise.all(
    DEPARTMENTS.map((name, i) => prisma.department.create({ data: { name, code: `DEP-${String(i + 1).padStart(3, '0')}`, category: 'Government Department' } })),
  )
  console.log(`  ✓ ${departments.length} departments`)

  /* categories + services ------------------------------------------------- */
  const catByCode = new Map<string, string>()
  for (const c of CATEGORIES) {
    const row = await prisma.serviceCategory.create({ data: { code: c.code, label: c.label } })
    catByCode.set(c.code, row.id)
  }
  for (const s of SERVICES) {
    await prisma.service.create({
      data: {
        slug: s.slug, code: s.code, name: s.name, categoryId: catByCode.get(s.cat)!, department: s.dept,
        fee: s.fee, govFee: s.fee, serviceCharge: 'Rs.20', processingTime: s.time, validity: s.validity,
        description: `${s.name} issued by ${s.dept}.`, formId: `form_${s.slug}`, producesDocumentType: s.produces ?? undefined,
        metadata: { icon: s.icon, popular: s.popular },
      },
    })
  }
  console.log(`  ✓ ${CATEGORIES.length} categories, ${SERVICES.length} services`)

  /* workflow -------------------------------------------------------------- */
  const humanize = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
  const wf = await prisma.workflow.create({ data: { code: 'gov.standard.v1', name: 'Government Standard Workflow', initial: 'submitted' } })
  await prisma.workflowStep.createMany({
    data: STAGES.map((stage, i) => ({
      workflowId: wf.id, stageId: stage, label: humanize(stage), actor: 'system',
      order: i, terminal: ['completed', 'rejected'].includes(stage),
    })),
  })
  console.log('  ✓ workflow gov.standard.v1')

  /* officers -------------------------------------------------------------- */
  const officers = []
  officers.push(await prisma.officer.create({
    data: { name: 'Tmt. R. Kalaivani', designation: 'Tahsildar', jurisdiction: 'Mylapore Taluk', district: 'Chennai', departmentId: departments[0].id },
  }))
  for (let i = 1; i < 100; i++) {
    officers.push(await prisma.officer.create({
      data: {
        name: `${pick(['Thiru.', 'Tmt.'], i)} ${pick(FIRST, i)} ${pick(LAST, i + 3)}`,
        designation: pick(['Tahsildar', 'Deputy Tahsildar', 'Revenue Inspector', 'Village Administrative Officer', 'Zonal Officer'], i),
        jurisdiction: `${pick(TN_DISTRICTS, i)} Taluk`, district: pick(TN_DISTRICTS, i),
        departmentId: pick(departments, i).id,
      },
    }))
  }
  console.log(`  ✓ ${officers.length} officers`)

  /* schemes --------------------------------------------------------------- */
  for (const base of SCHEMES) {
    const scheme = await prisma.scheme.create({
      data: {
        name: base.name, nameTamil: base.nameTamil, department: base.dept,
        benefit: base.benefit, benefitTamil: base.benefitTamil,
        budget: base.budget ?? undefined, purpose: base.purpose,
        matchScore: base.score, color: base.color,
      },
    })
    if (base.incomeMax) await prisma.eligibilityRule.create({ data: { schemeId: scheme.id, field: 'incomeMax', op: 'lte', value: String(base.incomeMax) } })
  }
  console.log(`  \u2713 ${SCHEMES.length} welfare schemes (2026 catalogue, no placeholders)`)

  /* demo citizen (frontend persona — MUST be first) ----------------------- */
  const demo = await prisma.citizen.create({
    data: {
      citizenId: 'TN-2024-XXXX-8842', fullName: 'Chandramoulishwarar K', dob: '22 May 2002', gender: 'Male',
      mobile: '+91 98XXX XXXXX', email: 'chandy@email.com', aadhaarMasked: 'XXXX XXXX 8842',
      district: 'Chennai', taluk: 'Mylapore', verified: true, verifiedVia: ['Aadhaar', 'DigiLocker'],
      addresses: {
        create: [
          { kind: 'current', line: '12/3, TTK Road, Alwarpet', area: 'Mylapore', district: 'Chennai', pincode: '600018' },
          { kind: 'permanent', line: '45, Gandhi Nagar', area: 'Srirangam', district: 'Tiruchirappalli', pincode: '620006' },
        ],
      },
    },
  })
  await prisma.document.createMany({
    data: [
      { citizenId: demo.id, name: 'Driving License', type: 'Transport', number: 'DL-TN-2024-8842', issuer: 'RTO Chennai', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: '12/2029', color: '#2563EB' },
      { citizenId: demo.id, name: 'Birth Certificate', type: 'Civil', number: 'BC-TN-2002-4421', issuer: 'GCC', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: 'Lifetime', color: '#7C3AED' },
      { citizenId: demo.id, name: 'Income Certificate', type: 'Revenue', number: 'IC-TN-2024-9912', issuer: 'Revenue Dept', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: '03/2025', color: '#059669' },
      { citizenId: demo.id, name: 'Ration Card', type: 'Civil Supplies', number: 'RC-TN-CHN-7788', issuer: 'Civil Supplies', holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: 'Active', color: '#059669' },
    ],
  })
  await prisma.notification.createMany({
    data: [
      { citizenId: demo.id, title: 'Birth Certificate Approved', body: 'Your application APP-2026-BC-1123 has been approved. Download from wallet.', category: 'application', priority: 'HIGH', read: false, actionPath: '/wallet', icon: 'CheckCircle', color: 'ok', createdAt: daysAgo(0) },
      { citizenId: demo.id, title: 'Complaint Assigned', body: 'CMP-TN-000452 assigned to GCC Zone 9 officer.', category: 'complaint', priority: 'MEDIUM', read: false, actionPath: '/tracker', icon: 'AlertTriangle', color: 'warn', createdAt: daysAgo(0) },
      { citizenId: demo.id, title: 'New Welfare Scheme Available', body: 'Annanin Seer Scheme - you may be eligible for an 8 g gold coin and silk saree.', category: 'scheme', priority: 'MEDIUM', read: true, actionPath: '/schemes', icon: 'Sparkles', color: 'info', createdAt: daysAgo(1) },
      { citizenId: demo.id, title: 'Service Deadline Tomorrow', body: 'Income Certificate APP-2026-IC-44821 deadline is June 21.', category: 'reminder', priority: 'HIGH', read: true, actionPath: '/tracker', icon: 'Clock', color: 'err', createdAt: daysAgo(1) },
      { citizenId: demo.id, title: 'Document Verified', body: 'Your Community Certificate has been verified by DigiLocker.', category: 'document', priority: 'MEDIUM', read: true, actionPath: '/wallet', icon: 'FileCheck', color: 'ok', createdAt: daysAgo(3) },
      { citizenId: demo.id, title: 'Rate Your Experience', body: 'How was your experience with the Birth Certificate service?', category: 'system', priority: 'LOW', read: true, icon: 'Star', color: 'sec', createdAt: daysAgo(5) },
    ],
  })
  // Static life timeline (matches frontend /citizen/timeline seed).
  await prisma.timelineEvent.createMany({
    data: [
      { citizenId: demo.id, year: '2002', title: 'Birth Certificate', subtitle: 'BC-TN-2002-4421 · GCC Chennai', kind: 'certificate', at: new Date('2002-05-22') },
      { citizenId: demo.id, year: '2008', title: 'School Admission', subtitle: 'Govt. Higher Secondary School, Mylapore', kind: 'milestone', at: new Date('2008-06-01') },
      { citizenId: demo.id, year: '2019', title: 'Community Certificate', subtitle: 'Lifetime validity · Tahsildar, Mylapore', kind: 'certificate', at: new Date('2019-03-14') },
      { citizenId: demo.id, year: '2024', title: 'Driving Licence', subtitle: 'DL-TN-2024-8842 · RTO Chennai', kind: 'certificate', at: new Date('2024-08-02') },
      { citizenId: demo.id, year: '2025', title: 'Ration Card (Smart Card)', subtitle: 'RC-TN-CHN-7788 · Civil Supplies', kind: 'certificate', at: new Date('2025-01-10') },
    ],
  })

  /* bulk citizens --------------------------------------------------------- */
  const citizenIds: string[] = [demo.id]
  for (let i = 0; i < 1000; i++) {
    const name = `${pick(FIRST, i)} ${pick(LAST, i + 2)}`
    const c = await prisma.citizen.create({
      data: {
        citizenId: `TN-2024-${String(1000 + i).padStart(4, '0')}-${2000 + i}`, fullName: name,
        dob: `${1 + rand(28)}/${1 + rand(12)}/19${60 + rand(45)}`, gender: pick(['Male', 'Female'], i),
        mobile: `+91 9${String(700000000 + i).slice(0, 9)}`, aadhaarMasked: `XXXX XXXX ${1000 + rand(9000)}`,
        district: pick(TN_DISTRICTS, i), taluk: pick(CHENNAI_TALUKS, i), verified: i % 3 !== 0,
        verifiedVia: i % 3 !== 0 ? ['Aadhaar'] : [],
        addresses: { create: [{ kind: 'current', line: `${1 + rand(99)}, ${pick(['Main Rd', 'Cross St', 'Bazaar St'], i)}`, area: pick(CHENNAI_TALUKS, i), district: pick(TN_DISTRICTS, i), pincode: `6000${10 + rand(89)}` }] },
      },
    })
    citizenIds.push(c.id)
  }
  console.log(`  ✓ ${citizenIds.length} citizens (incl. demo persona)`)

  /* applications ---------------------------------------------------------- */
  // A few recognizable demo apps first (match frontend reference numbers).
  const demoApps = [
    { ref: 'APP-2026-IC-44821', slug: 'svc_income', name: 'Income Certificate', stage: ApplicationStage.inspection },
    { ref: 'APP-2026-CC-44655', slug: 'svc_community', name: 'Community Certificate', stage: ApplicationStage.approval },
    { ref: 'APP-2026-BC-1123', slug: 'svc_birth', name: 'Birth Certificate', stage: ApplicationStage.completed },
  ]
  // Right to Services timing: deadline = filing date + the published processing
  // time; decided applications finish within (or, sometimes, after) it. Breaches
  // that predate the seed are pre-flagged so the first SLA sweep only acts on
  // new ones.
  const charter = (slug: string) => {
    const t = SERVICES.find((s) => s.slug === slug)?.time ?? '30d'
    return /same day/i.test(t) ? 1 : Number(/(\d+)/.exec(t)?.[1] ?? 30)
  }
  const timing = (slug: string, stage: ApplicationStage, createdAt: Date, i: number) => {
    const days = charter(slug)
    const slaDeadline = new Date(createdAt.getTime() + days * 86_400_000)
    const terminal = stage === ApplicationStage.completed || stage === ApplicationStage.rejected
    // ~85% of decided applications finish on time.
    const took = Math.max(1, Math.round(days * (i % 7 === 0 ? 1.4 : 0.35 + (i % 5) * 0.12)))
    const updatedAt = terminal ? new Date(Math.min(Date.now(), createdAt.getTime() + took * 86_400_000)) : undefined
    const slaBreachedAt = !terminal && slaDeadline.getTime() < Date.now() ? slaDeadline : undefined
    return { slaDeadline, updatedAt, slaBreachedAt }
  }

  for (const a of demoApps) {
    const createdAt = daysAgo(10)
    await prisma.application.create({
      data: {
        referenceNo: a.ref, serviceSlug: a.slug, serviceName: a.name, citizenId: demo.id, stage: a.stage,
        statusLabel: a.stage === ApplicationStage.completed ? 'Completed' : 'In Progress',
        officerId: officers[0].id, departmentId: departments[0].id, certIssued: a.stage === ApplicationStage.completed,
        createdAt, ...timing(a.slug, a.stage, createdAt, 1),
      },
    })
  }
  // Demo moment: one application a day past its deadline and not yet flagged.
  // "Run SLA check" in the Trust Center escalates it and notifies the citizen.
  const lateCreated = daysAgo(16)
  await prisma.application.create({
    data: {
      referenceNo: 'APP-2026-RES-44800', serviceSlug: 'svc_residence', serviceName: 'Residence Certificate', citizenId: demo.id,
      stage: ApplicationStage.inspection, statusLabel: 'In Progress', officerId: officers[0].id, departmentId: departments[0].id,
      createdAt: lateCreated, slaDeadline: new Date(lateCreated.getTime() + 15 * 86_400_000),
    },
  })
  let appSeq = 44822
  for (let i = 0; i < 496; i++) {
    const svc = pick(SERVICES, i)
    const stage = pick(STAGES, i * 7)
    const cid = pick(citizenIds, i + 1)
    const createdAt = daysAgo(rand(60))
    await prisma.application.create({
      data: {
        referenceNo: `APP-2026-${svc.code.split('-')[1]}-${appSeq++}`, serviceSlug: svc.slug, serviceName: svc.name,
        citizenId: cid, stage, statusLabel: stage === 'completed' ? 'Completed' : stage === 'rejected' ? 'Rejected' : 'In Progress',
        officerId: pick(officers, i).id, departmentId: pick(departments, i).id,
        certIssued: ['walletDelivery', 'notified', 'completed'].includes(stage), createdAt, ...timing(svc.slug, stage, createdAt, i),
      },
    })
  }
  console.log('  ✓ 500 applications (with Right to Services deadlines)')

  /* complaints ------------------------------------------------------------ */
  await prisma.complaint.create({
    data: { referenceNo: 'CMP-TN-000452', citizenId: demo.id, category: 'Road Damage', description: 'Road damage on TTK Road', priority: 'HIGH', status: ComplaintStatus.inProgress, department: 'GCC - Highways', etaDays: 5, createdAt: daysAgo(8) },
  })
  for (let i = 0; i < 199; i++) {
    const cat = pick(COMPLAINT_CATS, i)
    await prisma.complaint.create({
      data: {
        referenceNo: `CMP-TN-${String(500 + i).padStart(6, '0')}`, citizenId: pick(citizenIds, i + 1), category: cat,
        description: `${cat} reported in ${pick(CHENNAI_TALUKS, i)}`, priority: pick([Priority.LOW, Priority.MEDIUM, Priority.HIGH], i),
        status: pick(Object.values(ComplaintStatus), i), department: pick(['GCC - Highways', 'Metro Water / GCC'], i),
        etaDays: pick([5, 7], i), createdAt: daysAgo(rand(45)),
      },
    })
  }
  console.log('  ✓ 200 complaints')

  // seed audit anchor
  await prisma.auditLog.create({ data: { actor: 'system', action: 'seed', entity: 'platform', entityId: 'vetri', note: 'Demo data initialised' } })

  console.log('✅ Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

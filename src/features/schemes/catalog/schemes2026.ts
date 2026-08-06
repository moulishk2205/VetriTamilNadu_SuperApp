/**
 * Tamil Nadu welfare scheme catalogue — 2026 ecosystem.
 *
 * SINGLE SOURCE OF TRUTH for every surface that shows a welfare scheme:
 * mobile app, desktop portal, mock backend, search index, AI recommendations,
 * dashboard widgets and Demo Mode. Update a scheme here and it changes
 * everywhere. (The NestJS seed mirrors this list — see `backend/prisma/seed.ts`;
 * it is a separate package and cannot import from `src/`.)
 *
 * PROVENANCE: scheme names, benefits and budget allocations were supplied by the
 * product owner from the Tamil Nadu Government 2026 budget announcements. They
 * have not been re-verified against the published budget document in this repo —
 * confirm against the official source before public release.
 */

export interface Scheme2026 {
  id: string
  name: string
  /** Official Tamil name — shown when lang === 'ta' and indexed for search. */
  nameTamil: string
  department: string
  /** Head-line benefit, as announced. */
  benefit: string
  benefitTamil: string
  /** Announced budget allocation, where one was published. */
  budget?: string
  /** Eligibility-match score used by the recommendation engine. */
  matchScore: number
  color: string
  eligibility: { incomeMax?: number }
  /** Short purpose line for scheme detail and AI replies. */
  purpose: string
}

export const SCHEMES_2026: Scheme2026[] = [
  {
    id: 'sch_annanin_seer',
    name: 'Annanin Seer Scheme',
    nameTamil: 'அண்ணனின் சீர் திட்டம்',
    department: 'Social Welfare & Women Empowerment',
    benefit: '8 g gold coin + silk saree',
    benefitTamil: '8 கிராம் தங்க நாணயம் + பட்டுப் புடவை',
    budget: '₹812 Crore',
    matchScore: 92,
    color: '#DB2777',
    eligibility: { incomeMax: 250000 },
    purpose: 'Marriage assistance for eligible brides.',
  },
  {
    id: 'sch_thai_maaman',
    name: 'Thai Maaman Thanga Modhiram Scheme',
    nameTamil: 'தாய் மாமன் தங்க மோதிரம் திட்டம்',
    department: 'Health & Family Welfare',
    benefit: '1 g gold ring for every baby born in a Government hospital',
    benefitTamil: 'அரசு மருத்துவமனையில் பிறக்கும் ஒவ்வொரு குழந்தைக்கும் 1 கிராம் தங்க மோதிரம்',
    budget: '₹560 Crore',
    matchScore: 88,
    color: '#F59E0B',
    eligibility: {},
    purpose: 'Every baby born in a Government hospital receives a 1 gram gold ring.',
  },
  {
    id: 'sch_vetri_laptop',
    name: 'Vetri Laptop Scheme',
    nameTamil: 'வெற்றி மடிக்கணினி திட்டம்',
    department: 'Higher Education',
    benefit: 'Free laptop for college students',
    benefitTamil: 'கல்லூரி மாணவர்களுக்கு இலவச மடிக்கணினி',
    budget: '₹2,000 Crore',
    matchScore: 85,
    color: '#7C3AED',
    eligibility: {},
    purpose: 'Free laptops for college students.',
  },
  {
    id: 'sch_modern_bicycle',
    name: 'Modern Bicycle Scheme',
    nameTamil: 'நவீன மிதிவண்டி திட்டம்',
    department: 'School Education',
    benefit: 'Branded bicycle with helmet and bottle holder',
    benefitTamil: 'தலைக்கவசம் மற்றும் குடுவை வைப்பானுடன் நவீன மிதிவண்டி',
    budget: '₹777 Crore',
    matchScore: 80,
    color: '#0891B2',
    eligibility: {},
    purpose: 'Free branded bicycles with helmet and bottle holder for eligible students.',
  },
  {
    id: 'sch_vetri_skill',
    name: 'Vetri Skill Training Scheme',
    nameTamil: 'வெற்றி திறன் பயிற்சி திட்டம்',
    department: 'Labour Welfare & Skill Development',
    benefit: 'Industry skill training, internships and AI upskilling',
    benefitTamil: 'தொழில்துறை திறன் பயிற்சி, பயிற்சிப் பணி மற்றும் AI திறன் மேம்பாடு',
    matchScore: 78,
    color: '#2563EB',
    eligibility: {},
    purpose: 'Industry-oriented skill development, internships and AI skill training — Government target: train 5 lakh youth in AI by 2031.',
  },
  {
    id: 'sch_vetri_housing',
    name: 'Vetri Housing Scheme',
    nameTamil: 'வெற்றி வீட்டுவசதி திட்டம்',
    department: 'Housing & Urban Development',
    benefit: 'Housing assistance for eligible families',
    benefitTamil: 'தகுதியான குடும்பங்களுக்கு வீட்டுவசதி உதவி',
    matchScore: 74,
    color: '#059669',
    eligibility: { incomeMax: 300000 },
    purpose: 'Housing assistance for eligible families.',
  },
  {
    id: 'sch_vetri_goat',
    name: "Vetri Women's Goat Rearing Scheme",
    nameTamil: 'வெற்றி மகளிர் ஆடு வளர்ப்பு திட்டம்',
    department: 'Animal Husbandry',
    benefit: 'Goat rearing support for women',
    benefitTamil: 'மகளிருக்கு ஆடு வளர்ப்பு உதவி',
    matchScore: 70,
    color: '#16A34A',
    eligibility: { incomeMax: 200000 },
    purpose: 'Livelihood support for women through goat rearing.',
  },
  {
    id: 'sch_digital_library',
    name: 'Digital Library Initiative',
    nameTamil: 'டிஜிட்டல் நூலகத் திட்டம்',
    department: 'School Education',
    benefit: 'Free digital library access for students',
    benefitTamil: 'மாணவர்களுக்கு இலவச டிஜிட்டல் நூலக அணுகல்',
    matchScore: 66,
    color: '#8B5CF6',
    eligibility: {},
    purpose: 'Digital library access for students across Tamil Nadu.',
  },
  {
    id: 'sch_pmkisan',
    name: 'PM Kisan Samman Nidhi',
    nameTamil: 'பிரதம மந்திரி கிசான் சம்மான் நிதி',
    department: 'Agriculture',
    benefit: '₹6,000 per year',
    benefitTamil: 'ஆண்டுக்கு ₹6,000',
    matchScore: 95,
    color: '#0F766E',
    eligibility: { incomeMax: 300000 },
    purpose: 'Income support for land-holding farmer families (Government of India).',
  },
]

/** The scheme the citizen is nudged about in notifications and AI suggestions. */
export const FEATURED_SCHEME = SCHEMES_2026[0]

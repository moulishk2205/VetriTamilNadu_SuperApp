/**
 * The welfare-scheme catalogue: individual-benefit schemes of the Government
 * of Tamil Nadu (Revised Budget 2026-27, speech of 5 August 2026, paragraph
 * cited in `source`) plus continuing schemes. Conditions are only those the
 * source states; anything else is left to the department and said so in
 * `purpose`. Used by the seed and by sync-schemes.ts.
 *
 * Rule fields read facts (see eligibility.engine.ts): gender, age, annualIncome
 * (incomeMax), landHolder, community, area, kutchaHut, studentLevel,
 * schoolType, occupation, specialCategory. Values are fixed ids, never prose.
 */
export interface CatalogueScheme {
  name: string
  nameTamil?: string
  dept: string
  benefit: string
  budget?: string
  /** Order on the page: larger first. Not shown as a score. */
  score: number
  color: string
  purpose: string
  rules: { field: string; op: string; value: string }[]
}

const BUDGET = 'TN Revised Budget 2026-27 speech, 5 Aug 2026'

export const SCHEMES: CatalogueScheme[] = [
  // ─── New schemes of this Government ─────────────────────────────────────
  {
    name: 'Annanin Seer Scheme', nameTamil: 'அண்ணனின் சீர் திட்டம்', dept: 'Social Welfare & Women Empowerment',
    benefit: '8 g gold coin and a silk saree on the wedding day', budget: '₹812 Crore', score: 99, color: '#DB2777',
    purpose: `Wedding gift for women of Tamil Nadu. Detailed eligibility is to be notified separately; the department verifies each claim. (${BUDGET}, para 50)`,
    rules: [{ field: 'gender', op: 'eq', value: 'Female' }],
  },
  {
    name: 'Thai Maaman Thanga Mothiram Thittam', nameTamil: 'தாய் மாமன் தங்க மோதிரம் திட்டம்', dept: 'Health & Family Welfare',
    benefit: '1 g gold ring for every newborn delivered in a Government hospital', budget: '₹560 Crore', score: 98, color: '#F59E0B',
    purpose: `For every child born in a Government hospital, from 15 September 2026. Given at the hospital; no profile check applies. (${BUDGET}, paras 4, 56)`,
    rules: [],
  },
  {
    name: 'Vetri Veedu Thittam', nameTamil: 'வெற்றி வீடு திட்டம்', dept: 'Rural Development & Panchayat Raj',
    benefit: 'Pucca house at a unit cost of ₹5 lakh', budget: '₹3,500 Crore (70,000 houses in year one)', score: 97, color: '#059669',
    purpose: `Exclusively for families living in kutcha huts in rural areas. Beneficiaries are identified through a fresh door-to-door survey. (${BUDGET}, paras 131-132)`,
    rules: [{ field: 'area', op: 'eq', value: 'rural' }, { field: 'kutchaHut', op: 'eq', value: 'yes' }],
  },
  {
    name: 'Vetri Laptop Scheme', nameTamil: 'வெற்றி மடிக்கணினி திட்டம்', dept: 'Higher Education',
    benefit: 'Laptop for college students', budget: '₹2,000 Crore', score: 96, color: '#7C3AED',
    purpose: `Laptops for students pursuing higher education. (${BUDGET}, para 21)`,
    rules: [{ field: 'studentLevel', op: 'eq', value: 'college' }],
  },
  {
    name: 'Modern Bicycle Scheme', nameTamil: 'நவீன மிதிவண்டி திட்டம்', dept: 'School Education',
    benefit: 'Branded bicycle with helmet and water bottle', budget: '₹277 Crore', score: 95, color: '#0891B2',
    purpose: `For about 5.32 lakh students studying in Class XI in Government and Government-aided schools. (${BUDGET}, para 18)`,
    rules: [{ field: 'studentLevel', op: 'eq', value: 'class-11' }, { field: 'schoolType', op: 'in', value: 'government,aided' }],
  },
  {
    name: 'Perunthalaivar Kamarajar Breakfast Scheme', nameTamil: 'பெருந்தலைவர் காமராஜர் காலை உணவுத் திட்டம்', dept: 'Social Welfare & Women Empowerment',
    benefit: 'Free breakfast at school', budget: '₹710 Crore', score: 94, color: '#EA580C',
    purpose: `The Chief Minister's Breakfast Scheme, renamed and extended to Classes VI to VIII in Government and Government-aided schools from 17 September 2026 (15.14 lakh more students). Served at school; no claim needed. (${BUDGET}, para 51)`,
    rules: [],
  },
  {
    name: 'Vetri Magalir Goat Rearing Scheme', nameTamil: 'வெற்றி மகளிர் ஆடு வளர்ப்புத் திட்டம்', dept: 'Animal Husbandry, Dairying & Fisheries',
    benefit: 'Five goats or sheep with 100% subsidy', budget: '₹110 Crore (about 30,000 beneficiaries)', score: 93, color: '#16A34A',
    purpose: `For destitute widows, deserted women, transgender persons and persons with disabilities living in rural areas. (${BUDGET}, para 67)`,
    rules: [{ field: 'area', op: 'eq', value: 'rural' }, { field: 'specialCategory', op: 'in', value: 'destitute-widow,deserted-woman,transgender,disabled' }],
  },
  {
    name: 'Free Milch Cows for Rural Women', dept: 'Animal Husbandry, Dairying & Fisheries',
    benefit: 'A milch cow at no cost', budget: '₹57 Crore (10,000 women a year)', score: 92, color: '#65A30D',
    purpose: `To raise milk production and secure the livelihood of women in rural areas; 10,000 eligible women every year. The speech does not name the scheme. (${BUDGET}, para 74)`,
    rules: [{ field: 'gender', op: 'eq', value: 'Female' }, { field: 'area', op: 'eq', value: 'rural' }],
  },
  {
    name: 'Vetri Skill Training Scheme', nameTamil: 'வெற்றி திறன் பயிற்சி திட்டம்', dept: 'Labour Welfare & Skill Development',
    benefit: 'Industry-aligned skilling; internships with a monthly stipend', budget: '₹150 Crore', score: 91, color: '#2563EB',
    purpose: `For 12 lakh college students and 1 lakh unemployed youth this year; internships for 20,000 youth in phase one, with a stipend for graduates and holders of vocational qualifications. Priority to youth from families without permanent employment. (${BUDGET}, para 27)`,
    rules: [],
  },
  {
    name: 'Perunthalaivar Kamarajar Schools of Excellence', dept: 'School Education',
    benefit: 'Free residential schooling with food, boarding, textbooks and uniforms (Classes IX to XII)', budget: '₹125 Crore (infrastructure)', score: 90, color: '#0F766E',
    purpose: `For academically talented students from socio-economically disadvantaged backgrounds; admission is by selection. (${BUDGET}, para 14)`,
    rules: [],
  },
  {
    name: 'Vetri Entrepreneur Scheme', dept: 'Adi Dravidar & Tribal Welfare',
    benefit: 'Capital subsidy and interest subvention on the project cost', budget: '₹75 Crore', score: 89, color: '#9333EA',
    purpose: `Livelihood and enterprise support for Adi Dravidar and Tribal people. (${BUDGET}, para 37)`,
    rules: [{ field: 'community', op: 'in', value: 'SC,ST' }],
  },
  {
    name: 'Mannin Magal Thittam', nameTamil: 'மண்ணின் மகள் திட்டம்', dept: 'Adi Dravidar & Tribal Welfare',
    benefit: 'Help to become a landowner, with training in modern farming', budget: '₹20 Crore', score: 88, color: '#B45309',
    purpose: `To make Adi Dravidar and Tribal women agricultural labourers into landowners. (${BUDGET}, para 39)`,
    rules: [{ field: 'gender', op: 'eq', value: 'Female' }, { field: 'community', op: 'in', value: 'SC,ST' }, { field: 'occupation', op: 'eq', value: 'agricultural-labourer' }],
  },
  {
    name: 'Self-employment Support for Transgender Persons', dept: 'Social Welfare & Women Empowerment',
    benefit: 'Skill training and bank loans for self-employment with a subsidy of up to ₹50,000', score: 87, color: '#C026D3',
    purpose: `Skill training through the Tamil Nadu Skill Development Corporation and subsidy-linked credit for enterprises. The speech does not name the scheme. (${BUDGET}, para 54)`,
    rules: [{ field: 'specialCategory', op: 'eq', value: 'transgender' }],
  },
  {
    name: 'AI-based Assistive Devices Assistance', dept: 'Welfare of the Differently Abled',
    benefit: '50% of the device cost, up to ₹30,000', score: 86, color: '#0284C7',
    purpose: `For modern AI-based assistive devices not covered by the existing distribution scheme, such as sports prosthetic legs, myoelectric upper-limb prostheses and cochlear implant batteries. (${BUDGET}, para 47)`,
    rules: [{ field: 'specialCategory', op: 'eq', value: 'disabled' }],
  },
  {
    name: 'Kaalnadaigal Kaappom (Livestock Insurance)', nameTamil: 'கால்நடைகள் காப்போம்', dept: 'Animal Husbandry, Dairying & Fisheries',
    benefit: 'Insurance against livestock loss from mortality, disease or disaster', budget: '₹31 Crore', score: 85, color: '#4D7C0F',
    purpose: `New livestock insurance for farmers. Detailed terms are to be notified. (${BUDGET}, para 69)`,
    rules: [],
  },
  // ─── Continuing schemes ─────────────────────────────────────────────────
  {
    name: 'Magalir Urimai Thogai', nameTamil: 'மகளிர் உரிமைத் தொகை', dept: 'Social Welfare & Women Empowerment',
    benefit: '₹1,000 per month', score: 84, color: '#BE185D',
    purpose: 'Monthly assistance to women heads of family. Continues under this Government (Chief Minister\'s Office, May 2026); the ₹2,500 a month promised in the manifesto has not been notified. Conditions of the scheme: woman head of family, aged 21 or over, family income up to ₹2.5 lakh a year; land, electricity-use and employment exclusions are checked by the department.',
    rules: [{ field: 'gender', op: 'eq', value: 'Female' }, { field: 'ageMin', op: 'gte', value: '21' }, { field: 'incomeMax', op: 'lte', value: '250000' }],
  },
  {
    name: 'Lean-period Assistance for Fishermen', dept: 'Animal Husbandry, Dairying & Fisheries',
    benefit: '₹7,000 per family (raised from ₹6,000)', budget: '₹135 Crore (1.93 lakh families)', score: 83, color: '#0369A1',
    purpose: `For families of fishermen engaged in traditional fishing. (${BUDGET}, para 72)`,
    rules: [{ field: 'occupation', op: 'eq', value: 'traditional-fisher' }],
  },
  {
    name: 'Annal Ambedkar Business Champions Scheme', dept: 'Adi Dravidar & Tribal Welfare',
    benefit: 'Loans and capital subsidy for new enterprises', budget: '₹165 Crore', score: 82, color: '#7E22CE',
    purpose: `Entrepreneurship support for Adi Dravidar and Tribal people. (${BUDGET}, para 38)`,
    rules: [{ field: 'community', op: 'in', value: 'SC,ST' }],
  },
  {
    name: 'Annal Ambedkar Overseas Higher Education Scholarship', dept: 'Adi Dravidar & Tribal Welfare',
    benefit: 'Up to ₹36 lakh per student', budget: '₹131 Crore (362 students)', score: 81, color: '#6D28D9',
    purpose: `For students admitted to higher education at renowned international universities. (${BUDGET}, para 36)`,
    rules: [],
  },
  {
    name: 'BC, MBC & DNC Educational Scholarships', dept: 'Backward Classes, MBC & Minorities Welfare',
    benefit: 'Pre-matric and post-matric scholarships', budget: '₹372 Crore', score: 80, color: '#A16207',
    purpose: `For students of the Backward Classes, Most Backward Classes and De-notified Communities. (${BUDGET}, para 43)`,
    rules: [{ field: 'community', op: 'in', value: 'BC,MBC,DNC' }],
  },
  {
    name: 'PM Kisan Samman Nidhi', nameTamil: 'பிரதம மந்திரி கிசான் சம்மான் நிதி', dept: 'Agriculture & Farmers Welfare',
    benefit: '₹6,000 per year in three instalments', score: 79, color: '#15803D',
    purpose: 'Government of India scheme for land-holding farmer families. Exclusions (such as income-tax payers, government employees and professionals) are checked by the department.',
    rules: [{ field: 'landHolder', op: 'eq', value: 'yes' }],
  },
  {
    name: 'Digital Public Libraries', dept: 'School Education',
    benefit: 'Universal membership, free Wi-Fi, digital content and co-working spaces at the 38 district central libraries', budget: '₹10 Crore', score: 78, color: '#8B5CF6',
    purpose: `Public libraries redesigned as digital learning hubs, open to everyone. (${BUDGET}, para 17)`,
    rules: [],
  },
]

/** Old catalogue names that this catalogue replaces, for syncing an existing database. */
export const RENAMED: Record<string, string> = {
  'Vetri Housing Scheme': 'Vetri Veedu Thittam',
  'Digital Library Initiative': 'Digital Public Libraries',
  "Vetri Women's Goat Rearing Scheme": 'Vetri Magalir Goat Rearing Scheme',
}

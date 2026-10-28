// ═══════════════════════════════════════════
// TRANSLATION MAP (en → ta)
// Extracted verbatim from the prototype. Keys are the English source strings;
// values are their Tamil equivalents. `useT()` looks up here when lang === 'ta'
// and falls back to the key itself otherwise.
//
// Phase 2 expands this beyond UI chrome (scheme names, categories, FAQ, AI
// replies) and adds dynamic/AI translation for content that can't be
// hand-translated at build time.
// ═══════════════════════════════════════════

export type Lang = 'en' | 'ta'

export const translations: Record<string, string> = {
  'Home': 'முகப்பு', 'Services': 'சேவைகள்', 'Documents': 'ஆவணங்கள்', 'AI': 'AI உதவி', 'Profile': 'சுயவிவரம்',
  'Quick Access': 'விரைவு அணுகல்', 'My Applications': 'எனது விண்ணப்பங்கள்', 'My Complaints': 'எனது புகார்கள்',
  'Driving License': 'ஓட்டுநர் உரிமம்', 'Ration Card': 'ரேஷன் கார்டு', 'Birth Certificate': 'பிறப்புச் சான்றிதழ்',
  'Complaints': 'புகார்கள்', 'Track Service': 'சேவை கண்காணிப்பு', 'Schemes': 'திட்டங்கள்',
  'Digital Wallet': 'டிஜிட்டல் வாலெட்', 'Emergency': 'அவசர உதவி', 'All Services': 'அனைத்து சேவைகள்',
  'File Complaint': 'புகார் தாக்கல்', 'Service Tracker': 'சேவை நிலை', 'Scheme Discovery': 'திட்ட கண்டுபிடிப்பு',
  'MLA Dashboard': 'MLA டாஷ்போர்டு', 'District Scorecard': 'மாவட்ட மதிப்பெண்', 'Active Apps': 'செயலில் உள்ள விண்ணப்பங்கள்',
  'Open Complaint': 'திறந்த புகார்', 'View All': 'அனைத்தும் காண', 'File New': 'புதிய புகார்',
  'Open Wallet': 'வாலெட் திற', 'Eligible Schemes': 'தகுதியான திட்டங்கள்', 'found for you': 'உங்களுக்கு கிடைத்தது',
  'View': 'காண்க', 'Search services, documents...': 'சேவைகள், ஆவணங்கள் தேடுங்கள்...',
  'Notifications': 'அறிவிப்புகள்', 'Help & FAQ': 'உதவி', 'Settings': 'அமைப்புகள்',
  'Personal Details': 'தனிப்பட்ட விவரங்கள்', 'Address': 'முகவரி', 'Security & Privacy': 'பாதுகாப்பு',
  'Language': 'மொழி', 'Dark Mode': 'இருள் பயன்முறை', 'Accessibility': 'அணுகல்தன்மை',
  'My Activity': 'எனது நடவடிக்கை', 'Government Transparency': 'அரசு வெளிப்படைத்தன்மை',
  'Account': 'கணக்கு', 'Preferences': 'விருப்பத்தேர்வுகள்', 'Log Out': 'வெளியேறு',
  'My Documents': 'எனது ஆவணங்கள்', 'Continue': 'தொடரவும்', 'Submit': 'சமர்ப்பிக்க',
  'Police': 'காவல்', 'Ambulance': 'ஆம்புலன்ஸ்', 'Fire': 'தீயணைப்பு',
  'Verified': 'சரிபார்க்கப்பட்டது', 'QR Verify': 'QR சரிபார்', 'View Profile': 'சுயவிவரம் காண',
  'In Progress': 'செயலில்', 'Approved': 'ஒப்புதல்', 'Complete': 'முடிந்தது',
  'Category': 'வகை', 'Description': 'விளக்கம்', 'Priority': 'முன்னுரிமை', 'Department': 'துறை',
  'Send OTP': 'OTP அனுப்பு', 'Verify & Continue': 'சரிபார்த்து தொடரவும்',
  // ── 2026 welfare schemes (names mirror schemes2026.ts) ──────────────
  'Annanin Seer Scheme': 'அண்ணனின் சீர் திட்டம்',
  'Thai Maaman Thanga Modhiram Scheme': 'தாய் மாமன் தங்க மோதிரம் திட்டம்',
  'Vetri Laptop Scheme': 'வெற்றி மடிக்கணினி திட்டம்',
  'Modern Bicycle Scheme': 'நவீன மிதிவண்டி திட்டம்',
  'Vetri Skill Training Scheme': 'வெற்றி திறன் பயிற்சி திட்டம்',
  'Vetri Housing Scheme': 'வெற்றி வீட்டுவசதி திட்டம்',
  "Vetri Women's Goat Rearing Scheme": 'வெற்றி மகளிர் ஆடு வளர்ப்பு திட்டம்',
  'Digital Library Initiative': 'டிஜிட்டல் நூலகத் திட்டம்',
  'PM Kisan Samman Nidhi': 'பிரதம மந்திரி கிசான் சம்மான் நிதி',
  'Welfare Schemes': 'நலத்திட்டங்கள்', 'Recommended Schemes': 'பரிந்துரைக்கப்பட்ட திட்டங்கள்',
  'Allocation': 'நிதி ஒதுக்கீடு', 'Eligibility match': 'தகுதி பொருத்தம்',
  'High match': 'உயர் பொருத்தம்', 'Likely eligible': 'தகுதி வாய்ப்பு', 'Worth checking': 'சரிபார்க்கத் தக்கது',
  'Apply': 'விண்ணப்பிக்க', 'Compare': 'ஒப்பிடு', 'Comparing': 'ஒப்பிடுகிறது',
  // ── Desktop portal chrome ──────────────────────────────────────────
  'Dashboard': 'டாஷ்போர்டு', 'Applications': 'விண்ணப்பங்கள்', 'Digital Locker': 'டிஜிட்டல் பெட்டகம்',
  'Grievances': 'குறைகள்', 'Transparency': 'வெளிப்படைத்தன்மை', 'Help': 'உதவி',
  'Government of Tamil Nadu · Official Citizen Services Portal': 'தமிழ்நாடு அரசு · அதிகாரப்பூர்வ குடிமக்கள் சேவை வலைவாசல்',
  'Switch Experience': 'அனுபவத்தை மாற்று', 'My Profile': 'எனது சுயவிவரம்',
  'Quick Services': 'விரைவு சேவைகள்', 'Government Services': 'அரசு சேவைகள்',
  'Recent Applications': 'சமீபத்திய விண்ணப்பங்கள்', 'Announcements & Notices': 'அறிவிப்புகள் மற்றும் அறிக்கைகள்',
  'Grievance Timeline': 'குறை காலவரிசை', 'Government Departments': 'அரசுத் துறைகள்',
  'Quick Links': 'விரைவு இணைப்புகள்', 'Citizen Services': 'குடிமக்கள் சேவைகள்',
  'Overview': 'மேலோட்டம்', 'Eligibility': 'தகுதி', 'Review': 'மறுபரிசீலனை', 'Payment': 'கட்டணம்',
  'Previous': 'முந்தையது', 'Save draft': 'வரைவைச் சேமி', 'Service information': 'சேவைத் தகவல்',
  'Document checklist': 'ஆவணச் சரிபார்ப்புப் பட்டியல்', 'Help & support': 'உதவி மற்றும் ஆதரவு',
  'Application submitted': 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது', 'Reference number': 'குறிப்பு எண்',
  'Track application': 'விண்ணப்பத்தைக் கண்காணி', 'Print': 'அச்சிடு', 'Share': 'பங்கிடு',
  'Processing time': 'செயலாக்க நேரம்', 'Official fee': 'அதிகாரப்பூர்வ கட்டணம்', 'Validity': 'செல்லுபடி',
  'Get Started': 'தொடங்குங்கள்', 'Skip': 'தவிர்', 'Welcome to Vetri TN': 'வெற்றி TN-க்கு வரவேற்கிறோம்',
  // Copy refresh (sentence case, Indian English) and new labels
  'Quick access': 'விரைவு அணுகல்', 'My applications': 'எனது விண்ணப்பங்கள்', 'View all': 'அனைத்தும் காண', 'My complaints': 'எனது புகார்கள்', 'Driving Licence': 'ஓட்டுநர் உரிமம்', 'Open wallet': 'வாலெட் திற', 'Eligible schemes': 'தகுதியான திட்டங்கள்', 'Needs your action': 'உங்கள் நடவடிக்கை தேவை', 'Citizen ID': 'குடிமக்கள் அடையாள எண்', 'District': 'மாவட்டம்', 'Government of Tamil Nadu': 'தமிழ்நாடு அரசு', 'Linked to': 'இணைக்கப்பட்டது', 'Valid until': 'செல்லுபடி', 'Expired': 'காலாவதியானது', 'Report an issue': 'ஒரு பிரச்சினையைப் புகாரளி', 'Received': 'பெறப்பட்டது', 'What happens next': 'அடுத்து என்ன நடக்கும்', 'Copy': 'நகலெடு', 'Copied': 'நகலெடுக்கப்பட்டது',
  // Page titles shown bilingually in the portal header
  'Emergency Directory': 'அவசர உதவி எண்கள்', 'Digital Citizen Timeline': 'டிஜிட்டல் குடிமக்கள் காலவரிசை', 'Help & Support': 'உதவி & ஆதரவு', 'Ask Vetri': 'வெற்றியிடம் கேளுங்கள்', 'Page not found': 'பக்கம் கிடைக்கவில்லை',
}

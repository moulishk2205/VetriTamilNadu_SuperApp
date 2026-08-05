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
  'Get Started': 'தொடங்குங்கள்', 'Skip': 'தவிர்', 'Welcome to Vetri TN': 'வெற்றி TN-க்கு வரவேற்கிறோம்',
}

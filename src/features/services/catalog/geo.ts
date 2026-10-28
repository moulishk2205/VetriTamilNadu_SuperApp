/**
 * Tamil Nadu geography — the 38 districts and representative taluks, used for
 * form dropdowns and realistic demo data (officers, addresses, application IDs).
 */

export const TN_DISTRICTS: string[] = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar',
]

/** A few taluks per major district (representative, for demo prefill). */
export const TN_TALUKS: Record<string, string[]> = {
  Chennai: ['Mylapore', 'Egmore', 'Guindy', 'Ambattur', 'Sholinganallur'],
  Coimbatore: ['Coimbatore North', 'Coimbatore South', 'Mettupalayam', 'Pollachi', 'Sulur'],
  Madurai: ['Madurai North', 'Madurai South', 'Melur', 'Usilampatti', 'Vadipatti'],
  Tiruchirappalli: ['Srirangam', 'Lalgudi', 'Manapparai', 'Musiri', 'Thuraiyur'],
  Salem: ['Salem', 'Attur', 'Mettur', 'Omalur', 'Sankagiri'],
}

export const districtOptions = () => TN_DISTRICTS.map((d) => ({ value: d, label: d }))

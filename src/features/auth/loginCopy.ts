import type { Lang } from '@/lib/i18n/translations'

/**
 * Every word on the sign-in screens, in both languages. Sign-in is the one place
 * a citizen must be able to read before choosing a language, so it carries its
 * own complete copy rather than falling back to English key by key.
 */
export interface LoginCopy {
  gov: string
  cmTitle: string
  band: string
  rights: (year: number) => string
  /** The language the switch changes to, written in that language. */
  otherLang: string
  otherLangCode: Lang
  /** Accessible name; contains the visible word so voice control can target it. */
  otherLangLabel: string

  signIn: string
  ledeMobile: string
  ledeShort: string
  mobileLabel: string
  mobileHint: string
  send: string

  enterCode: string
  /** Wrapped around the number the code went to. */
  sentTo: [before: string, after: string]
  sentToAadhaar: string
  codeLabel: string
  verify: string
  changeNumber: string
  changeAadhaar: string
  notReceived: string
  sendNew: string
  sendNewIn: (time: string) => string
  sentAgain: string
  trust: string

  methodsLabel: string
  methodOtp: string
  methodAadhaar: string
  methodBiometric: string
  aadhaarLabel: string
  ledeAadhaar: string
  bioTitle: string
  bioLede: string
  authenticate: string
  useCode: string
  signingIn: string

  errors: Record<LoginError, string>
}

export type LoginError = 'mobileInvalid' | 'aadhaarInvalid' | 'sendFailed' | 'codeInvalid' | 'codeRejected' | 'bioFailed'

export const LOGIN_COPY: Record<Lang, LoginCopy> = {
  en: {
    gov: 'Government of Tamil Nadu',
    cmTitle: 'Hon’ble Chief Minister of Tamil Nadu',
    band: 'One citizen identity for every government service.',
    rights: (year) => `© ${year} VETRI · prototype, not an official Government service`,
    otherLang: 'தமிழ்',
    otherLangCode: 'ta',
    otherLangLabel: 'தமிழ் மொழிக்கு மாற்று',

    signIn: 'Sign in',
    ledeMobile: 'Enter your mobile number. We will text you a 6‑digit code.',
    ledeShort: 'We will text you a 6‑digit code.',
    mobileLabel: 'Mobile number',
    mobileHint: 'Use the number linked to your Aadhaar.',
    send: 'Send code',

    enterCode: 'Enter the code',
    sentTo: ['We sent a 6‑digit code to ', '.'],
    sentToAadhaar: 'We sent a 6‑digit code to the mobile number linked to your Aadhaar.',
    codeLabel: '6‑digit code',
    verify: 'Verify and sign in',
    changeNumber: 'Change number',
    changeAadhaar: 'Change Aadhaar number',
    notReceived: 'Not received a text?',
    sendNew: 'Send a new code',
    sendNewIn: (time) => `You can send a new code in\u00A0${time}.`,
    sentAgain: 'We sent a new code.',
    trust: 'Your session is encrypted. Vetri never stores your Aadhaar number or OTP.',

    methodsLabel: 'Sign-in method',
    methodOtp: 'Mobile OTP',
    methodAadhaar: 'Aadhaar',
    methodBiometric: 'Biometric',
    aadhaarLabel: 'Aadhaar number',
    ledeAadhaar: 'We will text a 6‑digit code to your Aadhaar-linked mobile.',
    bioTitle: 'Face ID or fingerprint',
    bioLede: 'Use the face or fingerprint unlock set up on this phone.',
    authenticate: 'Authenticate',
    useCode: 'Use a code instead',
    signingIn: 'Signing you in…',

    errors: {
      mobileInvalid: 'Enter a valid 10-digit mobile number.',
      aadhaarInvalid: 'Enter a valid 12-digit Aadhaar number.',
      sendFailed: 'Could not send the code. Check your connection and try again.',
      codeInvalid: 'Enter the 6-digit code.',
      codeRejected: 'That code was not accepted. Check it and try again.',
      bioFailed: 'Could not verify you. Try again or use a code.',
    },
  },
  ta: {
    gov: 'தமிழ்நாடு அரசு',
    cmTitle: 'மாண்புமிகு தமிழ்நாடு முதலமைச்சர்',
    band: 'அனைத்து அரசு சேவைகளுக்கும் ஒரே குடிமக்கள் அடையாளம்.',
    rights: (year) => `© ${year} வெற்றி · முன்மாதிரி, அதிகாரப்பூர்வ அரசு சேவை அல்ல`,
    otherLang: 'English',
    otherLangCode: 'en',
    otherLangLabel: 'Switch to English',

    signIn: 'உள்நுழைக',
    ledeMobile: 'உங்கள் கைபேசி எண்ணை உள்ளிடுங்கள். 6 இலக்கக் குறியீட்டைக் குறுஞ்செய்தியாக அனுப்புவோம்.',
    ledeShort: '6 இலக்கக் குறியீட்டைக் குறுஞ்செய்தியாக அனுப்புவோம்.',
    mobileLabel: 'கைபேசி எண்',
    mobileHint: 'உங்கள் ஆதாருடன் இணைக்கப்பட்ட எண்ணைப் பயன்படுத்துங்கள்.',
    send: 'குறியீட்டை அனுப்பு',

    enterCode: 'குறியீட்டை உள்ளிடுங்கள்',
    sentTo: ['', ' என்ற எண்ணுக்கு 6 இலக்கக் குறியீட்டை அனுப்பியுள்ளோம்.'],
    sentToAadhaar: 'உங்கள் ஆதாருடன் இணைக்கப்பட்ட கைபேசி எண்ணுக்கு 6 இலக்கக் குறியீட்டை அனுப்பியுள்ளோம்.',
    codeLabel: '6 இலக்கக் குறியீடு',
    verify: 'சரிபார்த்து உள்நுழைக',
    changeNumber: 'எண்ணை மாற்று',
    changeAadhaar: 'ஆதார் எண்ணை மாற்று',
    notReceived: 'குறுஞ்செய்தி வரவில்லையா?',
    sendNew: 'புதிய குறியீட்டை அனுப்பு',
    sendNewIn: (time) => `${time}\u00A0கழித்துப் புதிய குறியீட்டை அனுப்பலாம்.`,
    sentAgain: 'புதிய குறியீட்டை அனுப்பியுள்ளோம்.',
    trust: 'உங்கள் அமர்வு மறையாக்கம் செய்யப்பட்டுள்ளது. உங்கள் ஆதார் எண்ணையோ OTP-யையோ வெற்றி சேமிப்பதில்லை.',

    methodsLabel: 'உள்நுழையும் முறை',
    methodOtp: 'கைபேசி OTP',
    methodAadhaar: 'ஆதார்',
    methodBiometric: 'பயோமெட்ரிக்',
    aadhaarLabel: 'ஆதார் எண்',
    ledeAadhaar: 'உங்கள் ஆதாருடன் இணைக்கப்பட்ட கைபேசிக்கு 6 இலக்கக் குறியீட்டை அனுப்புவோம்.',
    bioTitle: 'முக அடையாளம் அல்லது கைரேகை',
    bioLede: 'இந்தக் கைபேசியில் அமைத்துள்ள முக அல்லது கைரேகைப் பூட்டைப் பயன்படுத்துங்கள்.',
    authenticate: 'சரிபார்',
    useCode: 'குறியீடு மூலம் உள்நுழைக',
    signingIn: 'உள்நுழைகிறது…',

    errors: {
      mobileInvalid: 'சரியான 10 இலக்கக் கைபேசி எண்ணை உள்ளிடுங்கள்.',
      aadhaarInvalid: 'சரியான 12 இலக்க ஆதார் எண்ணை உள்ளிடுங்கள்.',
      sendFailed: 'குறியீட்டை அனுப்ப முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயலுங்கள்.',
      codeInvalid: '6 இலக்கக் குறியீட்டை உள்ளிடுங்கள்.',
      codeRejected: 'அந்தக் குறியீடு ஏற்கப்படவில்லை. சரிபார்த்து மீண்டும் முயலுங்கள்.',
      bioFailed: 'உங்களைச் சரிபார்க்க முடியவில்லை. மீண்டும் முயலுங்கள் அல்லது குறியீட்டைப் பயன்படுத்துங்கள்.',
    },
  },
}

/** Digits only, capped at ten; a pasted or autofilled +91 / leading 0 is dropped. */
export function toMobile(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.length === 14 && d.startsWith('0091')) d = d.slice(4)
  else if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d.slice(0, 10)
}

/** 9876543210 → "98765 43210", the way mobile numbers are read out here. */
export const showMobile = (digits: string) => digits.replace(/^(\d{5})(?=\d)/, '$1 ')

/**
 * Call first in the mobile field's onChange. Re-grouping the digits rewrites the
 * field, which would throw the caret to the end; this puts it back after the
 * same number of digits, so a correction in the middle lands where it was made.
 */
export function keepMobileCaret(el: HTMLInputElement) {
  const before = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, '').length
  requestAnimationFrame(() => {
    if (document.activeElement !== el) return
    const at = Math.min(before + (before > 5 ? 1 : 0), el.value.length)
    el.setSelectionRange(at, at)
  })
}

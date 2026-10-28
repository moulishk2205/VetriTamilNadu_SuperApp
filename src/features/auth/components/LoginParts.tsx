import { CircleAlert, Languages, ShieldCheck } from 'lucide-react'
import cmPortrait from '@/assets/cm-portrait.webp'
import cmPortraitSmall from '@/assets/cm-portrait-640.webp'
import { Seal } from '@/components/ui'
import { TamilNaduMap } from '@/components/map/TamilNaduMap'
import { VetriWordmark } from '@/components/brand/VetriWordmark'
import type { LoginCopy } from '../loginCopy'

/**
 * The poster half of sign-in: the Chief Minister in front of the constituency
 * map, with the title lettering across the chest. Purely presentational — its
 * proportions come from the stylesheet, so the same markup serves both layouts.
 */
export function LoginPoster({ copy, sizes }: { copy: LoginCopy; sizes: string }) {
  return (
    <div className="vl-poster">
      <div className="vl-fig">
        <TamilNaduMap className="vl-map" />
        <span className="vl-halo" aria-hidden="true" />
        <img
          className="vl-cm"
          src={cmPortrait}
          srcSet={`${cmPortraitSmall} 640w, ${cmPortrait} 1280w`}
          sizes={sizes}
          width={1280}
          height={1600}
          alt={copy.cmTitle}
          decoding="async"
          fetchPriority="high"
        />
        {/* The portrait's alt text already says this; the tab is its visible caption. */}
        <p className="vl-cap" aria-hidden="true">
          <span className="vl-pill" lang="ta">மாண்புமிகு முதலமைச்சர்</span>
          <small>Hon’ble Chief Minister of Tamil Nadu</small>
        </p>
      </div>
      <div className="vl-word" lang="ta"><VetriWordmark play={false} still /></div>
    </div>
  )
}

/** Government identity on the left, the language switch on the right. */
export function LoginHead({ copy, onToggleLang, sealSize = 62 }: { copy: LoginCopy; onToggleLang: () => void; sealSize?: number }) {
  return (
    <header className="vl-head">
      <div className="vl-lock">
        <Seal size={sealSize} />
        <div>
          <b lang="ta">தமிழ்நாடு அரசு</b>
          <span lang="en">Government of Tamil Nadu</span>
        </div>
      </div>
      <button type="button" className="vl-lang" lang={copy.otherLangCode} onClick={onToggleLang} aria-label={copy.otherLangLabel}>
        <Languages size={18} strokeWidth={2.2} aria-hidden="true" />
        {copy.otherLang}
      </button>
    </header>
  )
}

/** An error under its field: an icon and words, never colour alone. */
export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p className="vl-err" id={id} role="alert">
      <CircleAlert size={17} strokeWidth={2.4} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

export function TrustLine({ copy }: { copy: LoginCopy }) {
  return (
    <div className="vl-trust">
      <ShieldCheck size={19} strokeWidth={2.2} aria-hidden="true" />
      <p>{copy.trust}</p>
    </div>
  )
}

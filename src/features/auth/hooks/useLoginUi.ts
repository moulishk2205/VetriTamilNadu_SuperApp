import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/hooks/useUi'
import { LOGIN_COPY } from '../loginCopy'

/** Sign-in copy in the citizen's language, plus the switch to the other one. */
export function useLoginCopy() {
  const { lang, setLang, anim } = useApp()
  return { lang, copy: LOGIN_COPY[lang], toggleLang: () => setLang(lang === 'en' ? 'ta' : 'en'), anim }
}

/**
 * The wait before another code can be asked for. `start()` arms it. Measured
 * against the clock, so it stays right after the page has been in the background.
 */
export function useResendTimer(seconds = 30) {
  const [until, setUntil] = useState(0)
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!until) return
    const sync = () => {
      const s = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      setLeft(s)
      if (!s) setUntil(0)
    }
    const id = window.setInterval(sync, 250)
    document.addEventListener('visibilitychange', sync)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', sync) }
  }, [until])
  const start = useCallback(() => { setUntil(Date.now() + seconds * 1000); setLeft(seconds) }, [seconds])
  return { left, start, label: `0:${String(left).padStart(2, '0')}` }
}

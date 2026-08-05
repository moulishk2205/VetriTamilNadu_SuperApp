import { useRef, useState } from 'react'
import { useUiStore } from '@/store/uiStore'

/**
 * Voice abstraction over the Web Speech API — Tamil/English recognition in,
 * speech synthesis out. Degrades gracefully where the API is unavailable
 * (`supported: false`); a native app swaps this hook for platform ASR/TTS.
 */

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function getRecognizer(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null
}

export function useVoice() {
  const lang = useUiStore((s) => s.lang)
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const supported = getRecognizer() !== null

  const cancelSpeech = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  const listen = (onText: (text: string) => void) => {
    const Rec = getRecognizer()
    if (!Rec) return
    cancelSpeech() // interruption: the citizen speaking always wins over TTS
    const rec = new Rec()
    recRef.current = rec
    rec.lang = lang === 'ta' ? 'ta-IN' : 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript
      if (transcript) onText(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    setListening(true)
    rec.start()
  }

  const stop = () => {
    recRef.current?.stop()
    setListening(false)
  }

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    cancelSpeech() // never overlap utterances
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'ta' ? 'ta-IN' : 'en-IN'
    window.speechSynthesis.speak(u)
  }

  return { supported, listening, listen, stop, speak, cancelSpeech }
}

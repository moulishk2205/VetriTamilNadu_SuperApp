import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Send, Trash2, ArrowRight, Loader2, Lightbulb, ShieldCheck } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { aiApi } from '@/features/ai/api/aiApi'
import { useAiStore } from '@/store/aiStore'
import { PageHeader, Panel, DeskBtn, EmptyState } from '@/app/desktop/DesktopUI'

/**
 * Ask Vetri — desktop workspace.
 *
 * Full-width conversation column with a persistent context rail (suggestions,
 * what the assistant can see, capability notes). Same `aiApi` + `useAiStore` as
 * the mobile assistant, so the conversation is shared across both experiences.
 */
export default function DesktopAI() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { citizen } = useAuth()
  const messages = useAiStore((s) => s.messages)
  const setMessages = useAiStore((s) => s.setMessages)
  const clear = useAiStore((s) => s.clear)

  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const { data: suggestions } = useQuery({ queryKey: ['ai', 'suggestions'], queryFn: aiApi.suggestions })

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setDraft('')
    const next = [...messages, { role: 'user' as const, text: q }]
    setMessages(next)
    setBusy(true)
    try {
      const reply = await aiApi.chat(q, next.map((m) => ({ role: m.role, text: m.text })))
      setMessages([...next, { role: 'ai' as const, text: reply.text, en: reply.en, acts: reply.actions?.map((a) => ({ l: a.label, s: a.screen })) }])
    } catch {
      setMessages([...next, { role: 'ai' as const, text: 'I could not reach the assistant service just now. Please try again in a moment.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Ask Vetri"
        subtitle="Your government assistant. Ask about any service, application or scheme — in Tamil or English."
        actions={messages.length > 0 ? <DeskBtn icon={Trash2} onClick={clear}>Clear conversation</DeskBtn> : undefined}
      />

      <div className="vtn-split">
        {/* ── Conversation ─────────────────────────────────────────────── */}
        <Panel padded={false}>
          <div style={{ minHeight: '48vh', maxHeight: '62vh', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 && (
              <EmptyState
                title={`Vanakkam ${citizen?.fullName?.split(' ')[0] ?? 'there'}`}
                desc="Ask about applying for a certificate, the status of an application, your documents, or which welfare schemes you may be eligible for."
              />
            )}

            {messages.map((m, i) => {
              const mine = m.role === 'user'
              return (
                <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '78%', background: mine ? c.pri : c.bgAlt, color: mine ? '#fff' : c.txt, borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '13px 16px' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                    {m.en && m.en !== m.text && (
                      <p style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 8, opacity: 0.72 }}>{m.en}</p>
                    )}
                    {m.acts && m.acts.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                        {m.acts.map((a) => (
                          <button key={a.l} onClick={() => onNav(a.s)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, border: `1px solid ${mine ? 'rgba(255,255,255,0.35)' : c.bdr}`, background: mine ? 'rgba(255,255,255,0.14)' : c.card, color: mine ? '#fff' : c.pri, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {a.l}<ArrowRight size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {busy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: c.txt2, fontSize: 13 }}>
                <Loader2 size={15} className="vtn-spin" />Vetri is thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); void send(draft) }}
            style={{ display: 'flex', gap: 10, padding: 16, borderTop: `1px solid ${c.bdr}`, background: c.bgAlt }}
          >
            <label htmlFor="vtn-ai-input" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Ask Vetri a question</label>
            <input
              id="vtn-ai-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a service, application, document or scheme…"
              style={{ flex: 1, minWidth: 0, padding: '12px 15px', borderRadius: 11, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
            <button type="submit" disabled={!draft.trim() || busy} aria-label="Send message"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 11, border: 'none', background: c.pri, color: '#fff', fontSize: 14, fontWeight: 700, cursor: !draft.trim() || busy ? 'not-allowed' : 'pointer', opacity: !draft.trim() || busy ? 0.55 : 1, fontFamily: 'inherit' }}>
              Send<Send size={15} />
            </button>
          </form>
        </Panel>

        {/* ── Context rail ─────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Suggested for you">
            {(suggestions?.items ?? []).length === 0 && (
              <p style={{ fontSize: 13, color: c.txt2 }}>Suggestions appear as you use government services.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {(suggestions?.items ?? []).map((s) => (
                <button key={s.id} onClick={() => void send(s.prompt)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <Lightbulb size={15} color={c.sec} style={{ flexShrink: 0 }} />{s.text}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="What Vetri can see">
            <p style={{ fontSize: 12.5, color: c.txt2, lineHeight: 1.7 }}>
              Your verified profile, your applications and their stages, the documents in your locker, and the welfare
              catalogue. Answers are generated from your own records — nothing is shared outside the platform.
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: c.txt3, marginTop: 13, paddingTop: 12, borderTop: `1px solid ${c.bdr}` }}>
              <ShieldCheck size={14} color={c.ok} />Conversation stored on this device only.
            </p>
          </Panel>

          <Panel title="Try asking">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['What is the status of my applications?', 'Which schemes am I eligible for?', 'How do I apply for an Income Certificate?', 'What documents are in my locker?'].map((q) => (
                <button key={q} onClick={() => void send(q)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 9, border: 'none', background: `${c.pri}08`, color: c.pri, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <Sparkles size={13} />{q}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

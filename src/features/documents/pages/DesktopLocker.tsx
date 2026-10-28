import { useMemo, useState } from 'react'
import { FolderOpen, Folder, FileText, Download, Share2, BadgeCheck, Pin, Clock, Hash, Building2, User } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Toolbar, Panel, EmptyState, LoadingRows, DeskBtn, StatusChip, Toast } from '@/app/desktop/DesktopUI'
import { useDocumentsQuery, useWalletDocumentCards } from '@/features/documents/hooks/useDocuments'

/**
 * Desktop digital locker — a file-explorer view of the citizen's verified
 * documents: folder rail by issuing type, searchable file grid and a preview
 * panel. Same `useDocumentsQuery()` as the mobile wallet.
 */
export default function DesktopLocker() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { isLoading } = useDocumentsQuery()
  const docs = useWalletDocumentCards()

  const [q, setQ] = useState('')
  const [folder, setFolder] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string[]>([])
  const [toast, setToast] = useState('')

  const folders = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of docs) map.set(d.tp, (map.get(d.tp) ?? 0) + 1)
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [docs])

  const files = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return docs.filter((d) => {
      if (folder !== 'all' && d.tp !== folder) return false
      if (!needle) return true
      return d.n.toLowerCase().includes(needle) || d.id.toLowerCase().includes(needle)
    })
  }, [docs, q, folder])

  const active = docs.find((d) => d.id === selected) ?? files[0]
  const togglePin = (id: string) => setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  /** Real download: writes a verifiable document record the citizen can keep. */
  const downloadDoc = (d: (typeof docs)[number]) => {
    const lines = [
      'GOVERNMENT OF TAMIL NADU \u2014 VETRI DIGITAL LOCKER',
      'VERIFIED DOCUMENT RECORD', '',
      `Document   : ${d.n}`,
      `Number     : ${d.id}`,
      `Category   : ${d.tp}`,
      `Holder     : ${d.h}`,
      `Validity   : ${d.v}`,
      `Retrieved  : ${new Date().toLocaleString('en-IN')}`, '',
      'This record was issued from the citizen\u2019s verified digital locker.',
      'Verify authenticity at the issuing department with the number above.',
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `${d.id}-record.txt`; a.click()
    URL.revokeObjectURL(url)
    setToast(`${d.n} downloaded`)
  }

  const shareDoc = async (d: (typeof docs)[number]) => {
    const text = `Vetri TN \u2014 ${d.n} (${d.id}), issued to ${d.h}. Valid: ${d.v}.`
    if (navigator.share) { try { await navigator.share({ title: d.n, text }); setToast('Share sheet opened') } catch { /* dismissed */ } }
    else { try { await navigator.clipboard.writeText(text); setToast('Document details copied to clipboard') } catch { setToast('Copy unavailable in this browser') } }
  }

  const FileTile = ({ d }: { d: (typeof docs)[number] }) => {
    const isPinned = pinned.includes(d.id)
    return (
      <button
        onClick={() => setSelected(d.id)}
        className="vtn-card vtn-hover"
        aria-pressed={active?.id === d.id}
        style={{ textAlign: 'left', padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, borderColor: active?.id === d.id ? c.pri : undefined, fontFamily: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ width: 42, height: 42, borderRadius: 13, background: d.cl, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <d.icon size={20} color="#fff" strokeWidth={1.9} />
          </span>
          <span
            role="button"
            tabIndex={0}
            aria-label={isPinned ? 'Unpin document' : 'Pin document'}
            onClick={(e) => { e.stopPropagation(); togglePin(d.id) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); togglePin(d.id) } }}
            style={{ padding: 5, borderRadius: 7, background: isPinned ? `${c.sec}22` : 'transparent', display: 'flex' }}
          >
            <Pin size={14} color={isPinned ? c.secDk : c.txt3} />
          </span>
        </div>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt, lineHeight: 1.35 }}>{d.n}</p>
          <p className="vtn-num" style={{ fontSize: 11, color: c.txt3, marginTop: 4 }}>{d.id}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${c.bdr}` }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: d.cl, textTransform: 'uppercase' }}>{d.tp}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: c.ok }}><BadgeCheck size={12} />Verified</span>
        </div>
      </button>
    )
  }

  return (
    <>
      <PageHeader
        title="Digital Locker"
        subtitle="Your government-issued documents, verified and available to download or share at any time."
        actions={<DeskBtn onClick={() => onNav('services')} icon={FileText}>Apply for a certificate</DeskBtn>}
      />

      {isLoading ? (
        <div className="vtn-card"><LoadingRows rows={4} /></div>
      ) : docs.length === 0 ? (
        <div className="vtn-card">
          <EmptyState
            title="Your locker is empty"
            desc="Certificates issued by government departments are delivered here automatically the moment they are approved."
            action={<DeskBtn variant="primary" onClick={() => onNav('services')}>Browse services</DeskBtn>}
          />
        </div>
      ) : (
        <div className="vtn-locker">
          {/* Folder rail */}
          <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel title="Folders" padded={false}>
              <div style={{ padding: 8 }}>
                <button onClick={() => setFolder('all')} style={folderRow(folder === 'all', c)}>
                  {folder === 'all' ? <FolderOpen size={16} color={c.pri} /> : <Folder size={16} color={c.txt3} />}
                  <span style={{ flex: 1 }}>All documents</span>
                  <span className="vtn-num" style={{ fontSize: 11.5, color: c.txt3 }}>{docs.length}</span>
                </button>
                {folders.map(([name, count]) => (
                  <button key={name} onClick={() => setFolder(name)} style={folderRow(folder === name, c)}>
                    {folder === name ? <FolderOpen size={16} color={c.pri} /> : <Folder size={16} color={c.txt3} />}
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                    <span className="vtn-num" style={{ fontSize: 11.5, color: c.txt3 }}>{count}</span>
                  </button>
                ))}
              </div>
            </Panel>

            {pinned.length > 0 && (
              <Panel title="Pinned" padded={false}>
                <div style={{ padding: 8 }}>
                  {pinned.map((id) => {
                    const d = docs.find((x) => x.id === id)
                    return d ? (
                      <button key={id} onClick={() => setSelected(id)} style={folderRow(false, c)}>
                        <Pin size={14} color={c.secDk} /><span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.n}</span>
                      </button>
                    ) : null
                  })}
                </div>
              </Panel>
            )}
          </div>

          {/* Files + preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <Toolbar query={q} onQuery={setQ} placeholder="Search documents by name or number…" />

            {files.length === 0 ? (
              <div className="vtn-card">
                <EmptyState title="No documents in this folder" desc="Try another folder, or clear the search to see every verified document in your locker." />
              </div>
            ) : (
              <div className="vtn-grid vtn-grid-3">{files.map((d) => <FileTile key={d.id} d={d} />)}</div>
            )}

            {active && (
              <Panel title="Document preview">
                <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
                  {/* Certificate face */}
                  <div style={{ border: `1px solid ${c.bdr}`, borderRadius: 12, padding: 20, background: `linear-gradient(160deg, ${active.cl}0D, transparent)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: active.cl, textTransform: 'uppercase' }}>{active.tp}</span>
                      <BadgeCheck size={18} color={c.ok} />
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: c.txt, marginTop: 14 }}>{active.n}</p>
                    <p className="vtn-num" style={{ fontSize: 12.5, color: c.txt2, marginTop: 6 }}>{active.id}</p>
                    <p style={{ fontSize: 12, color: c.txt2, marginTop: 18 }}>{active.h}</p>
                    <StatusChip label={`Valid: ${active.v}`} tone="ok" />
                  </div>

                  {/* Metadata + actions */}
                  <div>
                    <dl style={{ display: 'grid', gap: 12 }}>
                      {[
                        { icon: Hash, k: 'Document number', v: active.id, mono: true },
                        { icon: User, k: 'Holder', v: active.h },
                        { icon: Building2, k: 'Category', v: active.tp },
                        { icon: Clock, k: 'Validity', v: active.v },
                      ].map((r) => (
                        <div key={r.k} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                          <r.icon size={15} color={c.txt3} style={{ marginTop: 2, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <dt style={{ fontSize: 11, color: c.txt3 }}>{r.k}</dt>
                            <dd className={r.mono ? 'vtn-num' : undefined} style={{ fontSize: 13, color: c.txt, marginTop: 2, fontWeight: 500 }}>{r.v}</dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                    <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                      <DeskBtn variant="primary" icon={Download} onClick={() => downloadDoc(active)}>Download</DeskBtn>
                      <DeskBtn icon={Share2} onClick={() => void shareDoc(active)}>Share</DeskBtn>
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      )}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  )
}

const folderRow = (active: boolean, c: ReturnType<typeof useC>): React.CSSProperties => ({
  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9,
  background: active ? `${c.pri}0F` : 'transparent', border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: active ? 600 : 500, color: active ? c.pri : c.txt, fontFamily: 'inherit', textAlign: 'left',
})

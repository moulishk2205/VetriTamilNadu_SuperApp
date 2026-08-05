import { useRef, useState } from 'react'
import { UploadCloud, FileText, Trash2, RefreshCw, Eye, Lock, Wallet, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import type { DocFileInfo, WalletDocRef } from '@/components/forms/DocumentUpload'
import { mimesFor } from '@/lib/forms/docFormats'
import type { DocumentRequirement } from '@/lib/forms/types'

/**
 * Desktop upload manager for one document requirement.
 *
 * Drag & drop, upload progress, inline preview, replace and delete — plus
 * picking an already-verified document from the citizen's wallet. Format and
 * size validation reuse the SAME `mimesFor` constraints as the mobile uploader,
 * so official portal rules are enforced identically in both experiences.
 */
export function DesktopDocumentUpload({
  requirement,
  value,
  onChange,
  walletDocs,
}: {
  requirement: DocumentRequirement
  value: DocFileInfo | null
  onChange: (v: DocFileInfo | null) => void
  walletDocs: WalletDocRef[]
}) {
  const c = useC()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [preview, setPreview] = useState(false)

  const formats = requirement.acceptedFormats ?? ['pdf', 'jpeg', 'png']
  const accepted = mimesFor(formats)

  const handleFile = (file: File) => {
    if (!accepted.includes(file.type)) {
      setError(`Only ${formats.join(', ').toUpperCase()} files are accepted.`)
      return
    }
    const sizeKB = Math.round(file.size / 1024)
    if (requirement.maxSizeKB && sizeKB > requirement.maxSizeKB) {
      setError(`Maximum ${requirement.maxSizeKB} KB — this file is ${sizeKB} KB.`)
      return
    }
    setError('')
    setProgress(0)
    let p = 0
    const iv = setInterval(() => {
      p += 25
      if (p >= 100) {
        clearInterval(iv)
        setProgress(null)
        if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
        const isImg = file.type.startsWith('image/')
        onChange({
          source: 'device', name: file.name, mime: file.type, sizeKB,
          previewUrl: isImg ? URL.createObjectURL(file) : undefined,
          isPdf: file.type === 'application/pdf',
        })
      } else setProgress(p)
    }, 110)
  }

  const clear = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    onChange(null)
    setError('')
    setPreview(false)
  }

  // ── Attached state ──────────────────────────────────────────────────────
  if (value) {
    return (
      <div style={{ border: `1px solid ${c.ok}3D`, background: `${c.ok}08`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: `${c.ok}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={19} color={c.ok} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</p>
            <p className="vtn-num" style={{ fontSize: 11.5, color: c.txt2, marginTop: 2 }}>
              {value.source === 'wallet' ? `From wallet · ${value.walletNumber ?? 'verified'}` : `${value.sizeKB ?? 0} KB · ${value.mime ?? 'file'}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {(value.previewUrl || value.isPdf) && (
              <button onClick={() => setPreview((v) => !v)} title="Preview" aria-label="Preview document" style={iconBtn(c)}><Eye size={15} color={c.txt2} /></button>
            )}
            <button onClick={() => inputRef.current?.click()} title="Replace" aria-label="Replace document" style={iconBtn(c)}><RefreshCw size={15} color={c.txt2} /></button>
            <button onClick={clear} title="Remove" aria-label="Remove document" style={iconBtn(c)}><Trash2 size={15} color={c.err} /></button>
          </div>
        </div>

        {preview && value.previewUrl && (
          <img src={value.previewUrl} alt={value.name} style={{ width: '100%', maxHeight: 260, objectFit: 'contain', marginTop: 12, borderRadius: 9, border: `1px solid ${c.bdr}`, background: c.bg }} />
        )}
        {preview && !value.previewUrl && (
          <p style={{ fontSize: 12, color: c.txt2, marginTop: 12, padding: 14, borderRadius: 9, border: `1px solid ${c.bdr}`, background: c.bg, textAlign: 'center' }}>
            PDF attached — it will be submitted with your application.
          </p>
        )}

        <input ref={inputRef} type="file" accept={accepted.join(',')} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
      </div>
    )
  }

  // ── Empty / dropzone state ──────────────────────────────────────────────
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${requirement.label}`}
        style={{
          border: `1.5px dashed ${dragOver ? c.pri : c.bdr}`,
          background: dragOver ? `${c.pri}0A` : c.bg,
          borderRadius: 12, padding: '26px 20px', textAlign: 'center', cursor: 'pointer',
          transition: 'border-color .15s ease, background .15s ease',
        }}
      >
        {progress !== null ? (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>Uploading…</p>
            <div style={{ height: 5, borderRadius: 3, background: c.bdr, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: c.pri, borderRadius: 3, transition: 'width .1s linear' }} />
            </div>
            <p className="vtn-num" style={{ fontSize: 11.5, color: c.txt2, marginTop: 7 }}>{progress}%</p>
          </>
        ) : (
          <>
            <UploadCloud size={26} color={dragOver ? c.pri : c.txt3} style={{ margin: '0 auto' }} />
            <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt, marginTop: 10 }}>
              Drag &amp; drop, or <span style={{ color: c.pri }}>browse</span>
            </p>
            <p className="vtn-num" style={{ fontSize: 11.5, color: c.txt3, marginTop: 5 }}>
              {formats.join(', ').toUpperCase()}{requirement.maxSizeKB ? ` · max ${requirement.maxSizeKB} KB` : ''}
            </p>
          </>
        )}
        <input ref={inputRef} type="file" accept={accepted.join(',')} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
      </div>

      {/* Alternative sources */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
        {walletDocs.length > 0 && (
          <button onClick={() => setShowWallet((v) => !v)} style={altBtn(c)}>
            <Wallet size={13} color={c.pri} />Use a wallet document
          </button>
        )}
        <button disabled title="Coming when official integration becomes available" style={{ ...altBtn(c), opacity: 0.5, cursor: 'not-allowed' }}>
          <Lock size={13} color={c.txt3} />Import from DigiLocker
        </button>
        <span style={{ fontSize: 10.5, color: c.txt3 }}>DigiLocker — coming when official integration becomes available</span>
      </div>

      {showWallet && (
        <div style={{ marginTop: 10, border: `1px solid ${c.bdr}`, borderRadius: 11, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${c.bdr}`, background: c.bgAlt }}>
            <p style={{ flex: 1, fontSize: 12, fontWeight: 700, color: c.txt2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Verified documents</p>
            <button onClick={() => setShowWallet(false)} aria-label="Close wallet picker" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={15} color={c.txt3} /></button>
          </div>
          {walletDocs.map((d, i, arr) => (
            <button
              key={d.id}
              onClick={() => { onChange({ source: 'wallet', name: d.name, walletDocId: d.id, walletNumber: d.number }); setShowWallet(false); setError('') }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <FileText size={16} color={c.pri} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.txt }}>{d.name}</span>
                <span className="vtn-num" style={{ display: 'block', fontSize: 11, color: c.txt3, marginTop: 2 }}>{d.number}</span>
              </span>
              <CheckCircle2 size={14} color={c.ok} />
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: c.err, marginTop: 9 }}>
          <AlertTriangle size={13} />{error}
        </p>
      )}
    </div>
  )
}

const iconBtn = (c: ReturnType<typeof useC>): React.CSSProperties => ({
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.bdr}`, background: c.bg,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
})
const altBtn = (c: ReturnType<typeof useC>): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9,
  border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt2, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
})

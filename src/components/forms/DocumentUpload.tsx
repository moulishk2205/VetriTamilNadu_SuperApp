import { useRef, useState } from 'react'
import { Upload, FileText, Image as ImageIcon, X, RefreshCw, Wallet, Lock, Check } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import type { DocumentRequirement } from '@/lib/forms/types'
import { mimesFor } from '@/lib/forms/docFormats'

/** A satisfied document requirement — either an uploaded file or a wallet pick. */
export interface DocFileInfo {
  source: 'device' | 'wallet'
  name: string
  mime?: string
  sizeKB?: number
  previewUrl?: string
  isPdf?: boolean
  walletDocId?: string
  walletNumber?: string
}

export interface WalletDocRef {
  id: string
  name: string
  number: string
  type: string
}



export function DocumentUpload({
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

  const formats = requirement.acceptedFormats ?? ['pdf', 'jpeg', 'png']
  const acceptAttr = mimesFor(formats).join(',')

  const handleFile = (file: File) => {
    if (!mimesFor(formats).includes(file.type)) {
      setError(`Only ${formats.join(', ').toUpperCase()} allowed`)
      return
    }
    const sizeKB = Math.round(file.size / 1024)
    if (requirement.maxSizeKB && sizeKB > requirement.maxSizeKB) {
      setError(`Max ${requirement.maxSizeKB} KB — this file is ${sizeKB} KB`)
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
        onChange({ source: 'device', name: file.name, mime: file.type, sizeKB, previewUrl: isImg ? URL.createObjectURL(file) : undefined, isPdf: file.type === 'application/pdf' })
      } else {
        setProgress(p)
      }
    }, 110)
  }

  const remove = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    setError('')
    onChange(null)
  }

  const dashed = `1.5px dashed ${dragOver ? c.pri : c.bdr}`

  // ── Filled state ──────────────────────────────────────────────────────────
  if (value) {
    return (
      <div style={{ border: `1px solid ${c.bdr}`, borderRadius: 14, padding: 12, display: 'flex', gap: 12, alignItems: 'center', background: c.card }}>
        {value.previewUrl ? (
          <img src={value.previewUrl} alt={value.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 8, background: `${c.pri}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {value.source === 'wallet' ? <Wallet size={20} color={c.pri} /> : value.isPdf ? <FileText size={20} color={c.pri} /> : <ImageIcon size={20} color={c.pri} />}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: c.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value.name}</p>
          <p style={{ fontSize: 11, color: c.ok, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} /> {value.source === 'wallet' ? `From Wallet · ${value.walletNumber ?? ''}` : `${value.sizeKB} KB uploaded`}
          </p>
        </div>
        <button onClick={() => inputRef.current?.click()} title="Replace" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}><RefreshCw size={16} color={c.txt2} /></button>
        <button onClick={remove} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}><X size={16} color={c.err} /></button>
        <input ref={inputRef} type="file" accept={acceptAttr} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    )
  }

  // ── Empty / upload state ──────────────────────────────────────────────────
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
        style={{ border: dashed, borderRadius: 14, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', background: dragOver ? `${c.pri}06` : 'transparent' }}
      >
        {progress !== null ? (
          <div>
            <p style={{ fontSize: 12, color: c.txt2, marginBottom: 8 }}>Uploading… {progress}%</p>
            <div style={{ height: 6, background: c.bdr, borderRadius: 3 }}><div style={{ height: '100%', width: `${progress}%`, background: c.pri, borderRadius: 3, transition: 'width 0.1s' }} /></div>
          </div>
        ) : (
          <>
            <Upload size={22} color={c.pri} />
            <p style={{ fontSize: 13, fontWeight: 600, color: c.txt, marginTop: 6 }}>Tap or drag &amp; drop to upload</p>
            <p style={{ fontSize: 10, color: c.txt3, marginTop: 2 }}>{formats.join(', ').toUpperCase()} · max {requirement.maxSizeKB ?? 500} KB</p>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {walletDocs.length > 0 && (
          <button onClick={() => setShowWallet((s) => !s)} style={{ flex: 1, padding: '9px 10px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: c.txt }}>
            <Wallet size={14} color={c.pri} /> From Wallet
          </button>
        )}
        <button disabled title="Coming when official integration becomes available" style={{ flex: 1, padding: '9px 10px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.bgAlt, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: c.txt3 }}>
          <Lock size={13} /> Import from DigiLocker
        </button>
      </div>
      <p style={{ fontSize: 9, color: c.txt3, marginTop: 4, textAlign: 'right' }}>DigiLocker — coming when official integration becomes available</p>

      {showWallet && (
        <div style={{ marginTop: 8, border: `1px solid ${c.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
          {walletDocs.map((d) => (
            <button key={d.id} onClick={() => { onChange({ source: 'wallet', name: d.name, walletDocId: d.id, walletNumber: d.number }); setShowWallet(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: 'none', borderBottom: `1px solid ${c.bdr}`, background: c.card, cursor: 'pointer', textAlign: 'left' }}>
              <Wallet size={16} color={c.pri} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>{d.name}</p>
                <p style={{ fontSize: 11, color: c.txt2, fontFamily: 'monospace' }}>{d.number}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: c.err, marginTop: 6 }}>{error}</p>}
      <input ref={inputRef} type="file" accept={acceptAttr} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

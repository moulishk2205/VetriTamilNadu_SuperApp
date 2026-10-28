import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ExternalLink, QrCode } from 'lucide-react'
import { useC } from '@/hooks/useUi'

/** Public verification address for a certificate (the QR's payload). */
function verifyUrl(number: string, sig: string): string {
  return `${window.location.origin}/verify/${encodeURIComponent(number)}?s=${encodeURIComponent(sig)}`
}

/**
 * QR code printed on every certificate. Anyone (a bank, a school, an
 * employer) scans it and the public /verify page confirms with the issuing
 * department that the certificate is genuine and unaltered, without logging in.
 */
export function CertificateQr({ number, sig }: { number: string; sig?: string }) {
  const c = useC()
  const [src, setSrc] = useState<string | null>(null)
  const url = sig ? verifyUrl(number, sig) : null

  useEffect(() => {
    if (!url) return
    let alive = true
    void QRCode.toDataURL(url, { margin: 1, width: 168, errorCorrectionLevel: 'M' }).then((d) => alive && setSrc(d))
    return () => { alive = false }
  }, [url])

  if (!url) return null
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 18, padding: 12, border: `1px dashed ${c.bdr}`, borderRadius: 12 }}>
      {src ? <img src={src} width={96} height={96} alt={`QR code to verify certificate ${number}`} style={{ borderRadius: 6, background: '#fff' }} /> : <QrCode size={48} color={c.txt3} />}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: c.txt }}>Scan to verify</p>
        <p style={{ fontSize: 11.5, color: c.txt2, marginTop: 3, lineHeight: 1.45 }}>Anyone can confirm this certificate is genuine and unaltered, without signing in.</p>
        <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: c.pri, marginTop: 6 }}>
          Open verification page <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}

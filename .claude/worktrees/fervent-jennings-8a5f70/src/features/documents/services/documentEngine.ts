import { gateway } from '@/lib/integrations/registry'
import { createLogger } from '@/lib/logger/logger'
import { documentsApi } from '../api/documentsApi'

const log = createLogger('documents')

/** Minimal reference the engine needs to act on a document. */
export interface DocRef {
  id?: string
  name: string
  number: string
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* clipboard blocked; no-op */
  }
}

/**
 * Document Engine — the single reusable service behind the wallet.
 * Operations: list/get, download, share, QR verification, and a DigiLocker
 * refresh seam. Every document action in the app goes through here.
 */
export const documentEngine = {
  list: () => documentsApi.list(),
  get: (id: string) => documentsApi.get(id),

  /** A verifiable reference URL (what a QR would encode). */
  verificationUrl(doc: DocRef): string {
    return `https://verify.vetri.tn/d/${encodeURIComponent(doc.number)}`
  },

  /** Download the document as a file. */
  download(doc: DocRef): void {
    log.info('document.download', { number: doc.number })
    const payload = JSON.stringify({ document: doc.name, number: doc.number, issuer: 'Government of Tamil Nadu', verify: documentEngine.verificationUrl(doc) }, null, 2)
    triggerDownload(new Blob([payload], { type: 'application/json' }), `${doc.number}.json`)
  },

  /** Share via the Web Share API, falling back to clipboard. */
  async share(doc: DocRef): Promise<void> {
    log.info('document.share', { number: doc.number })
    const shareData = { title: doc.name, text: `${doc.name} — ${doc.number}`, url: documentEngine.verificationUrl(doc) }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
        return
      } catch {
        /* user cancelled or unsupported; fall through */
      }
    }
    await copyToClipboard(`${shareData.text} · ${shareData.url}`)
  },

  /** QR verification — share/copy the verification URL a QR would carry. */
  async showQr(doc: DocRef): Promise<void> {
    log.info('document.qr', { number: doc.number })
    const url = documentEngine.verificationUrl(doc)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `Verify ${doc.name}`, url })
        return
      } catch {
        /* fall through */
      }
    }
    await copyToClipboard(url)
  },

  /** Pull the latest verified copy from DigiLocker (mock adapter for now). */
  refreshFromDigiLocker(doc: DocRef) {
    return gateway.get('digilocker').pullDocument(doc.id ?? doc.number)
  },
}

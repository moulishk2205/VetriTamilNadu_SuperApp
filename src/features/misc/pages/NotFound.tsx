import { useNavigate } from 'react-router-dom'
import { useC } from '@/hooks/useUi'

/**
 * 404 route. New (the prototype had no notion of an unknown URL) but styled to
 * match the app's theme tokens so it never looks out of place.
 */
export default function NotFound() {
  const c = useC()
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 64, fontWeight: 900, color: c.pri, fontFamily: 'monospace' }}>404</p>
      <p style={{ fontSize: 16, fontWeight: 600, color: c.txt, marginTop: 8 }}>Page not found</p>
      <p style={{ fontSize: 13, color: c.txt2, marginTop: 6, maxWidth: 280 }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <button
        onClick={() => navigate('/home')}
        style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, background: c.pri, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Go to Home
      </button>
    </div>
  )
}

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { createLogger } from '@/lib/logger/logger'

const log = createLogger('react')

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/**
 * App-wide error boundary. Catches render/runtime errors anywhere in the tree,
 * logs them through the structured logger (Phase-2 remote sink), and shows a
 * themed recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('render error', { message: error.message, stack: error.stack, componentStack: info.componentStack })
  }

  private reset = () => {
    this.setState({ hasError: false })
    window.location.assign('/home')
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(90% 60% at 50% 0%, #FFE200 0%, #FFC401 34%, #F4EAC4 72%)', fontFamily: "'Inter','Noto Sans Tamil',system-ui,sans-serif" }}>
        <div style={{ width: '100%', maxWidth: 380, padding: '32px 28px 28px', borderRadius: 28, background: '#FFFEFA', border: '1px solid rgba(138,28,21,0.07)', boxShadow: '0 40px 70px -32px rgba(120,58,0,0.55)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 17, background: '#8A1C15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={26} color="#FFF5F3" aria-hidden="true" />
          </div>
          <p style={{ marginTop: 16, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1A12' }}>Something went wrong</p>
          <p style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5, color: '#5F584A' }}>An unexpected error occurred. You can return to the home screen and try again.</p>
          <button onClick={this.reset} style={{ marginTop: 20, padding: '13px 28px', borderRadius: 999, background: '#8A1C15', color: '#FFF5F3', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 12px 22px -12px rgba(138,28,21,0.75)' }}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }
}

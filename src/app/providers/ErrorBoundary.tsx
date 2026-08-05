import { Component, type ErrorInfo, type ReactNode } from 'react'
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center', fontFamily: "'Inter','Noto Sans Tamil',system-ui,sans-serif" }}>
        <p style={{ fontSize: 44, fontWeight: 900, color: '#9B1B30' }}>⚠</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E' }}>Something went wrong</p>
        <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 280 }}>An unexpected error occurred. You can return to the home screen and try again.</p>
        <button onClick={this.reset} style={{ marginTop: 8, padding: '12px 24px', borderRadius: 12, background: '#9B1B30', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Go to Home
        </button>
      </div>
    )
  }
}

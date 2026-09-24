// ─────────────────────────────────────────────
//  ErrorBoundary: evita pantallas en blanco ante crashes no capturados
// ─────────────────────────────────────────────
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no capturado en la UI:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="error-boundary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 12,
            padding: 24,
            textAlign: 'center',
            color: 'var(--text)',
          }}
        >
          <span style={{ fontSize: 40 }}>🌯💥</span>
          <h2 style={{ margin: 0 }}>Algo salió mal</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {this.state.error.message || 'Error inesperado en la interfaz.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            🔄 Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
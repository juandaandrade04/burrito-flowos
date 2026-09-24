// ─────────────────────────────────────────────
//  Página de Login
// ─────────────────────────────────────────────
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const destino = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.')
      return
    }
    setCargando(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-logo">
          <span className="emoji">🌯</span>
          <h1>
            Burrito <span>FlowOS</span>
          </h1>
          <p>Sistema de Gestión de Ventas e Insumos</p>
        </div>

        {error && <div className="alert-inline error">{error}</div>}

        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@burritoflowos.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="login-btn" type="submit" disabled={cargando}>
          {cargando ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>

        <p className="login-hint">
          Demo admin: admin@burritoflowos.com / Admin123!
          <br />
          Demo cajero: cajero@burritoflowos.com / Cajero123!
        </p>
      </form>
    </div>
  )
}
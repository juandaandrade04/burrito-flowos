// ─────────────────────────────────────────────
//  Guard de rutas: exige sesión y rol admin
// ─────────────────────────────────────────────
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function Cargando() {
  return (
    <div className="login-page">
      <div className="login-card">
        <p>Cargando…</p>
      </div>
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { autenticado, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <Cargando />
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { autenticado, cargando, esAdmin } = useAuth()
  const location = useLocation()

  if (cargando) return <Cargando />
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!esAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
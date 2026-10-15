// ─────────────────────────────────────────────
//  Contexto de autenticación
//  La identidad vive en la cookie de sesión HttpOnly del servidor.
//  El navegador NO guarda token ni usuario en localStorage.
// ─────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/lib/api'
import type { LoginResponse, Usuario } from '@/types/api'

interface AuthContextValue {
  usuario: Usuario | null
  autenticado: boolean
  cargando: boolean
  esAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  // Al montar, se pregunta al servidor si hay una sesión activa.
  useEffect(() => {
    let activo = true
    api<{ usuario: Usuario }>('GET', '/auth/sesion')
      .then((data) => {
        if (activo) setUsuario(data.usuario)
      })
      .catch(() => {
        if (activo) setUsuario(null)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<LoginResponse>('POST', '/auth/login', { email, password })
    setUsuario(data.usuario)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('POST', '/auth/logout')
    } catch {
      // Aun sin red, cerramos sesión en el cliente
    }
    setUsuario(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      autenticado: usuario !== null,
      cargando,
      esAdmin: usuario?.rol === 'administrador',
      login,
      logout,
    }),
    [usuario, cargando, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
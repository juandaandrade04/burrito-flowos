// ─────────────────────────────────────────────
//  Contexto de autenticación
// ─────────────────────────────────────────────
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/lib/api'
import type { LoginResponse, Usuario } from '@/types/api'

const TOKEN_KEY = 'bflow_token'
const USUARIO_KEY = 'bflow_usuario'

interface AuthContextValue {
  usuario: Usuario | null
  token: string | null
  esAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function leerUsuario(): Usuario | null {
  try {
    const raw = localStorage.getItem(USUARIO_KEY)
    return raw ? (JSON.parse(raw) as Usuario) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario)

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<LoginResponse>('POST', '/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USUARIO_KEY, JSON.stringify(data.usuario))
    setToken(data.token)
    setUsuario(data.usuario)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('POST', '/auth/logout')
    } catch {
      // Aun sin red, cerramos sesión en el cliente
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
    setToken(null)
    setUsuario(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      token,
      esAdmin: usuario?.rol === 'administrador',
      login,
      logout,
    }),
    [usuario, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
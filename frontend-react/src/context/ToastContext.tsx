// ─────────────────────────────────────────────
//  Sistema de notificaciones (toasts) ligero
// ─────────────────────────────────────────────
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type TipoToast = 'success' | 'error' | 'warning'

interface ToastItem {
  id: number
  tipo: TipoToast
  mensaje: string
}

interface ToastContextValue {
  toast: (mensaje: string, tipo?: TipoToast) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONOS: Record<TipoToast, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const contador = useRef(0)

  const remover = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (mensaje: string, tipo: TipoToast = 'success') => {
      const id = ++contador.current
      setToasts((prev) => [...prev, { id, tipo, mensaje }])
      window.setTimeout(() => remover(id), 3500)
    },
    [remover],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tipo}`} onClick={() => remover(t.id)}>
            <span>{ICONOS[t.tipo]}</span>
            <span>{t.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
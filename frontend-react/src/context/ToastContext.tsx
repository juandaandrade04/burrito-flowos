// ─────────────────────────────────────────────
//  Sistema de notificaciones (toasts) con SweetAlert2
// ─────────────────────────────────────────────
import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import Swal from 'sweetalert2'

type TipoToast = 'success' | 'error' | 'warning'

interface ToastContextValue {
  toast: (mensaje: string, tipo?: TipoToast) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer)
    el.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback((mensaje: string, tipo: TipoToast = 'success') => {
    Toast.fire({ icon: tipo, title: mensaje })
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
// ─────────────────────────────────────────────
//  Modal genérico (clicks fuera cierran)
// ─────────────────────────────────────────────
import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  titulo: string
  onClose: () => void
  children: ReactNode
  ancho?: number
}

export function Modal({ open, titulo, onClose, children, ancho = 480 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="overlay show"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" style={ancho ? { maxWidth: ancho } : undefined}>
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
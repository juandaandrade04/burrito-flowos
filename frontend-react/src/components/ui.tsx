// ─────────────────────────────────────────────
//  Badge / Empty / Loader — piezas pequeñas de UI
// ─────────────────────────────────────────────
import type { ReactNode } from 'react'

type ColorBadge = 'green' | 'red' | 'orange' | 'blue' | 'gray'

export function Badge({ color, children }: { color: ColorBadge; children: ReactNode }) {
  return <span className={`badge ${color}`}>{children}</span>
}

export function Empty({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="empty">
      <span>{icon}</span>
      <p>{children}</p>
    </div>
  )
}

export function Loader({ children = 'Cargando…' }: { children?: ReactNode }) {
  return <div className="loader">{children}</div>
}
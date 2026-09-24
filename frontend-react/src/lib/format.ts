// ─────────────────────────────────────────────
//  Utilidades de formato
// ─────────────────────────────────────────────

export function formatCOP(n: number): string {
  return '$' + Number(n).toLocaleString('es-CO')
}

export function formatFecha(str: string): string {
  return new Date(str).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

export function iniciales(nombre: string): string {
  return (nombre || '?')[0].toUpperCase()
}
// ─────────────────────────────────────────────
//  Cliente HTTP para la API Burrito FlowOS
// ─────────────────────────────────────────────
import type { ApiError } from '@/types/api'

const API_BASE = '/api/v1'

export class ApiRequestError extends Error {
  readonly codigo: number
  readonly detalles?: ApiError['error']

  constructor(codigo: number, mensaje: string, detalles?: ApiError['error']) {
    super(mensaje)
    this.name = 'ApiRequestError'
    this.codigo = codigo
    this.detalles = detalles
  }
}

// Cabeceras comunes. El token ya no viaja desde el navegador: la autenticación
// se resuelve con la cookie de sesión HttpOnly que el gateway adjunta sola.
export function authHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' }
}

export async function api<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: authHeaders(),
    credentials: 'same-origin', // envía la cookie de sesión
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, opts)
  const data = (await res.json().catch(() => ({}))) as T & ApiError

  if (!res.ok) {
    throw new ApiRequestError(
      data.error?.codigo ?? res.status,
      data.error?.mensaje ?? 'Error desconocido',
      data.error,
    )
  }
  return data
}

// Descarga un archivo binario (PDF, etc.) autenticado y dispara el guardado en el navegador.
export async function apiDownload(path: string, filename: string): Promise<void> {
  const opts: RequestInit = {
    method: 'GET',
    credentials: 'same-origin', // envía la cookie de sesión
  }

  const res = await fetch(`${API_BASE}${path}`, opts)
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError
    throw new ApiRequestError(
      data.error?.codigo ?? res.status,
      data.error?.mensaje ?? 'Error desconocido',
      data.error,
    )
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
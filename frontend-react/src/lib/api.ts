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

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bflow_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function api<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const opts: RequestInit = { method, headers: authHeaders() }
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
  const token = localStorage.getItem('bflow_token')
  const opts: RequestInit = {
    method: 'GET',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
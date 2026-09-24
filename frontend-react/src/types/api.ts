// ─────────────────────────────────────────────
//  Tipos compartidos de la API Burrito FlowOS
// ─────────────────────────────────────────────

export type Rol = 'administrador' | 'cajero'

export type Unidad = 'gr' | 'kg' | 'un' | 'lt' | 'ml'

// ── Error estándar de la API ────────────────
export interface ApiError {
  error: {
    codigo: number
    mensaje: string
    faltantes?: { insumo: string; disponible: number; necesario: number; unidad: string }[]
    timestamp?: string
  }
}

// ── Usuario ──────────────────────────────────
export interface Usuario {
  _id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

// ── Insumo (inventory-service) ───────────────
export interface Insumo {
  _id: string
  nombre: string
  cantidad_actual: number
  unidad_medida: Unidad
  stock_minimo: number
  activo: boolean
  alerta_stock: boolean
  createdAt?: string
  updatedAt?: string
}

// ── Receta ───────────────────────────────────
export interface Ingrediente {
  insumo: string | Partial<Insumo>
  cantidad: number
  unidad: Unidad
}

export interface Receta {
  _id: string
  nombre: string
  precio: number
  descripcion?: string
  ingredientes: Ingrediente[]
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

// ── Venta ────────────────────────────────────
export interface Venta {
  _id: string
  usuario: string | Pick<Usuario, '_id' | 'nombre' | 'email' | 'rol'> | null
  receta?: string
  tipo_burrito: string
  es_combo: boolean
  cantidad: number
  precio_unitario: number
  total: number
  anulada: boolean
  createdAt: string
  updatedAt?: string
}

export interface Estadisticas {
  total_ventas: number
  total_burritos: number
}

// ── Respuestas de la API ─────────────────────
export interface LoginResponse {
  mensaje: string
  token: string
  usuario: Usuario
  expira_en: string
}

export interface InsumosResponse {
  total: number
  insumos: Insumo[]
}

export interface RecetasResponse {
  total: number
  recetas: Receta[]
}

export interface VentasResponse {
  total: number
  pagina: number
  limite: number
  estadisticas: Estadisticas
  ventas: Venta[]
}

export interface UsuariosResponse {
  total: number
  usuarios: Usuario[]
}
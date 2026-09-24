// ─────────────────────────────────────────────
//  Recetas: grid de recetas + crear con ingredientes
// ─────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Insumo, InsumosResponse, Receta, RecetasResponse, Unidad } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/Modal'
import { Empty, Loader } from '@/components/ui'
import { formatCOP } from '@/lib/format'

const UNIDADES: Unidad[] = ['gr', 'kg', 'un', 'lt', 'ml']

interface IngForm {
  insumo: string
  cantidad: string
  unidad: Unidad
}

interface RecetaForm {
  id: string
  nombre: string
  precio: string
  descripcion: string
  ingredientes: IngForm[]
}

const ING_VACIO: IngForm = { insumo: '', cantidad: '', unidad: 'gr' }
const FORM_VACIO: RecetaForm = { id: '', nombre: '', precio: '', descripcion: '', ingredientes: [] }

export default function RecetasPage() {
  const { esAdmin } = useAuth()
  const { toast } = useToast()
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<RecetaForm>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await api<RecetasResponse>('GET', '/recetas')
      setRecetas(data.recetas || [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error cargando recetas', 'error')
    } finally {
      setCargando(false)
    }
  }, [toast])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirNueva = async () => {
    try {
      const data = await api<InsumosResponse>('GET', '/insumos')
      setInsumos(data.insumos || [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error cargando insumos', 'error')
    }
    setForm({ ...FORM_VACIO, ingredientes: [{ ...ING_VACIO }] })
    setModal(true)
  }

  const cambiarIng = (idx: number, campo: keyof IngForm, valor: string) => {
    setForm((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.map((ing, i) =>
        i === idx ? { ...ing, [campo]: valor as Unidad } : ing,
      ),
    }))
  }

  const guardar = async () => {
    const cuerpo = {
      nombre: form.nombre.trim(),
      precio: parseFloat(form.precio),
      descripcion: form.descripcion.trim(),
      ingredientes: form.ingredientes
        .filter((ing) => ing.insumo && parseFloat(ing.cantidad) > 0)
        .map((ing) => ({
          insumo: ing.insumo,
          cantidad: parseFloat(ing.cantidad),
          unidad: ing.unidad,
        })),
    }
    if (!cuerpo.nombre || !cuerpo.precio) {
      toast('Nombre y precio son obligatorios.', 'error')
      return
    }
    if (cuerpo.ingredientes.length === 0) {
      toast('Agrega al menos un ingrediente.', 'error')
      return
    }
    setGuardando(true)
    try {
      if (form.id) {
        await api('PUT', `/recetas/${form.id}`, cuerpo)
        toast('Receta actualizada.')
      } else {
        await api('POST', '/recetas', cuerpo)
        toast('Receta creada.')
      }
      setModal(false)
      cargar()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error guardando receta', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (r: Receta) => {
    if (!window.confirm(`¿Eliminar la receta "${r.nombre}"?`)) return
    try {
      await api('DELETE', `/recetas/${r._id}`)
      toast('Receta eliminada.')
      cargar()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error eliminando receta', 'error')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>📋 Recetas del Menú</h3>
        <div className="card-actions">
          <button className="btn btn-secondary btn-sm" onClick={cargar}>
            ↺ Actualizar
          </button>
          {esAdmin && (
            <button className="btn btn-primary btn-sm" onClick={abrirNueva}>
              ➕ Nueva receta
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <Loader />
      ) : recetas.length === 0 ? (
        <Empty icon="📋">Sin recetas aún</Empty>
      ) : (
        <div
          style={{
            padding: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {recetas.map((r) => (
            <div
              key={r._id}
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>🌯 {r.nombre}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                    {r.descripcion || ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--orange)' }}>
                    {formatCOP(r.precio)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    +15% combo: {formatCOP(Math.round(r.precio * 1.15))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 12,
                }}
              >
                {(r.ingredientes || []).map((ing, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      padding: '4px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span>{typeof ing.insumo === 'object' ? ing.insumo.nombre : '—'}</span>
                    <span style={{ color: 'var(--text)' }}>
                      {ing.cantidad} {ing.unidad}
                    </span>
                  </div>
                ))}
              </div>

              {esAdmin && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => eliminar(r)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        titulo={form.id ? 'Editar Receta' : 'Nueva Receta'}
        onClose={() => setModal(false)}
        ancho={540}
      >
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre del burrito</label>
              <input
                className="input input-full"
                placeholder="Ej: Burrito Sabanero"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Precio (COP)</label>
              <input
                className="input input-full"
                type="number"
                min={0}
                placeholder="0"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <input
              className="input input-full"
              placeholder="Descripción del burrito"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              Ingredientes{' '}
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                (insumo · cantidad · unidad)
              </span>
            </label>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 8,
              }}
            >
              {form.ingredientes.map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 70px 28px',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <select
                    className="input"
                    style={{ fontSize: 12 }}
                    value={ing.insumo}
                    onChange={(e) => cambiarIng(idx, 'insumo', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {insumos.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.nombre} ({i.unidad_medida})
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Cant."
                    value={ing.cantidad}
                    onChange={(e) => cambiarIng(idx, 'cantidad', e.target.value)}
                  />
                  <select
                    className="input"
                    style={{ fontSize: 12 }}
                    value={ing.unidad}
                    onChange={(e) => cambiarIng(idx, 'unidad', e.target.value)}
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-danger btn-icon btn-sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        ingredientes: prev.ingredientes.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  ingredientes: [...prev.ingredientes, { ...ING_VACIO }],
                }))
              }
            >
              ➕ Añadir ingrediente
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModal(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            💾 {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
// ─────────────────────────────────────────────
//  Insumos: tabla + CRUD con modal
// ─────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Insumo, InsumosResponse, Unidad } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/Modal'
import { Badge, Empty, Loader } from '@/components/ui'

const UNIDADES: Unidad[] = ['gr', 'kg', 'un', 'lt', 'ml']

interface FormState {
  id: string
  nombre: string
  cantidad_actual: string
  unidad_medida: Unidad
  stock_minimo: string
}

const FORM_VACIO: FormState = {
  id: '',
  nombre: '',
  cantidad_actual: '',
  unidad_medida: 'gr',
  stock_minimo: '',
}

export default function InsumosPage() {
  const { esAdmin } = useAuth()
  const { toast } = useToast()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await api<InsumosResponse>('GET', '/insumos')
      setInsumos(data.insumos || [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error cargando insumos', 'error')
    } finally {
      setCargando(false)
    }
  }, [toast])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtrados = insumos.filter((i) =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const abrirNuevo = () => {
    setForm(FORM_VACIO)
    setModal(true)
  }

  const abrirEditar = (ins: Insumo) => {
    setForm({
      id: ins._id,
      nombre: ins.nombre,
      cantidad_actual: String(ins.cantidad_actual),
      unidad_medida: ins.unidad_medida,
      stock_minimo: String(ins.stock_minimo),
    })
    setModal(true)
  }

  const guardar = async () => {
    const cuerpo = {
      nombre: form.nombre.trim(),
      cantidad_actual: parseFloat(form.cantidad_actual),
      unidad_medida: form.unidad_medida,
      stock_minimo: parseFloat(form.stock_minimo) || 0,
    }
    if (!cuerpo.nombre) {
      toast('El nombre es obligatorio.', 'error')
      return
    }
    setGuardando(true)
    try {
      if (form.id) {
        await api('PUT', `/insumos/${form.id}`, cuerpo)
        toast('Insumo actualizado.')
      } else {
        await api('POST', '/insumos', cuerpo)
        toast('Insumo creado.')
      }
      setModal(false)
      cargar()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error guardando insumo', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (ins: Insumo) => {
    if (!window.confirm(`¿Eliminar el insumo "${ins.nombre}"?`)) return
    try {
      await api('DELETE', `/insumos/${ins._id}`)
      toast('Insumo eliminado.')
      cargar()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error eliminando insumo', 'error')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>📦 Inventario de Insumos</h3>
        <div className="card-actions">
          <input
            className="input"
            placeholder="🔍 Buscar insumo…"
            style={{ width: 200 }}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn btn-secondary btn-sm" onClick={cargar}>
            ↺ Actualizar
          </button>
          {esAdmin && (
            <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>
              ➕ Nuevo insumo
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap">
        {cargando ? (
          <Loader />
        ) : filtrados.length === 0 ? (
          <Empty icon="📦">Sin insumos encontrados</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Stock mín.</th>
                <th>Estado</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((i) => (
                <tr key={i._id}>
                  <td>
                    <strong>{i.nombre}</strong>
                  </td>
                  <td
                    style={{
                      color: i.alerta_stock ? 'var(--red)' : 'var(--green)',
                      fontWeight: 600,
                    }}
                  >
                    {i.cantidad_actual}
                  </td>
                  <td>
                    <Badge color="gray">{i.unidad_medida}</Badge>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{i.stock_minimo}</td>
                  <td>
                    {i.alerta_stock ? (
                      <Badge color="red">⚠️ Stock bajo</Badge>
                    ) : (
                      <Badge color="green">✅ OK</Badge>
                    )}
                  </td>
                  {esAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(i)}>
                          ✏️
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminar(i)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal}
        titulo={form.id ? 'Editar Insumo' : 'Nuevo Insumo'}
        onClose={() => setModal(false)}
      >
        <div className="modal-body">
          <div className="form-group">
            <label>Nombre del insumo</label>
            <input
              className="input input-full"
              placeholder="Ej: Pierna de cerdo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cantidad actual</label>
              <input
                className="input input-full"
                type="number"
                min={0}
                placeholder="0"
                value={form.cantidad_actual}
                onChange={(e) => setForm({ ...form, cantidad_actual: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Unidad de medida</label>
              <select
                className="input input-full"
                value={form.unidad_medida}
                onChange={(e) =>
                  setForm({ ...form, unidad_medida: e.target.value as Unidad })
                }
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u} — {u === 'gr' ? 'gramos' : u === 'kg' ? 'kilogramos' : u === 'un' ? 'unidades' : u === 'lt' ? 'litros' : 'mililitros'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Stock mínimo (alerta)</label>
            <input
              className="input input-full"
              type="number"
              min={0}
              placeholder="0"
              value={form.stock_minimo}
              onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
            />
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
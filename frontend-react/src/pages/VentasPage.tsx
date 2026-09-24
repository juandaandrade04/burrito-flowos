// ─────────────────────────────────────────────
//  Ventas: registro de venta + historial + anular
// ─────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Receta, RecetasResponse, Venta, VentasResponse } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { formatCOP, formatFecha } from '@/lib/format'
import { Badge, Empty, Loader } from '@/components/ui'

interface PreviewState {
  precioUnitario: number
  total: number
  esCombo: boolean
  nombre: string
}

export default function VentasPage() {
  const { esAdmin } = useAuth()
  const { toast } = useToast()

  // Panel de registro
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [recetaSel, setRecetaSel] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [esCombo, setEsCombo] = useState(false)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [alert, setAlert] = useState('')
  const [registrando, setRegistrando] = useState(false)

  // Historial
  const [ventas, setVentas] = useState<Venta[]>([])
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargarVentas = useCallback(
    async (fDesde = desde, fHasta = hasta) => {
      if (!esAdmin) return
      setCargando(true)
      try {
        let qs = ''
        if (fDesde) qs += `&desde=${fDesde}`
        if (fHasta) qs += `&hasta=${fHasta}`
        const data = await api<VentasResponse>('GET', `/ventas?limit=50${qs}`)
        setVentas(data.ventas || [])
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Error cargando ventas', 'error')
      } finally {
        setCargando(false)
      }
    },
    [esAdmin, desde, hasta, toast],
  )

  const cargarSelectRecetas = useCallback(async () => {
    try {
      const data = await api<RecetasResponse>('GET', '/recetas')
      setRecetas(data.recetas || [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error cargando recetas', 'error')
    }
  }, [toast])

  useEffect(() => {
    cargarSelectRecetas()
    cargarVentas()
  }, [cargarSelectRecetas, cargarVentas])

  useEffect(() => {
    if (!recetaSel) {
      setPreview(null)
      return
    }
    const receta = recetas.find((r) => r._id === recetaSel)
    if (!receta) return
    const precioUnit = esCombo ? Math.round(receta.precio * 1.15) : receta.precio
    setPreview({
      precioUnitario: precioUnit,
      total: precioUnit * Math.max(1, cantidad),
      esCombo,
      nombre: receta.nombre,
    })
  }, [recetaSel, cantidad, esCombo, recetas])

  const registrar = async () => {
    setAlert('')
    if (!recetaSel) {
      setAlert('Selecciona un burrito.')
      return
    }
    if (!cantidad || cantidad < 1) {
      setAlert('La cantidad debe ser al menos 1.')
      return
    }
    const receta = recetas.find((r) => r._id === recetaSel)
    setRegistrando(true)
    try {
      const data = await api<{ total: number }>('POST', '/ventas', {
        tipo_burrito: receta?.nombre,
        es_combo: esCombo,
        cantidad,
      })
      toast(`Venta registrada: ${formatCOP(data.total)}`)
      setRecetaSel('')
      setCantidad(1)
      setEsCombo(false)
      cargarVentas()
    } catch (e) {
      setAlert(e instanceof Error ? e.message : 'Error registrando la venta')
    } finally {
      setRegistrando(false)
    }
  }

  const anular = async (id: string) => {
    if (!window.confirm('¿Anular esta venta? Los insumos serán devueltos al inventario.')) return
    try {
      await api('DELETE', `/ventas/${id}`)
      toast('Venta anulada e insumos devueltos.')
      cargarVentas()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error anulando venta', 'error')
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
      {/* Panel registrar venta */}
      <div className="card">
        <div className="card-header">
          <h3>➕ Registrar Venta</h3>
        </div>
        <div className="modal-body">
          {alert && <div className="alert-inline error">{alert}</div>}

          <div className="form-group">
            <label>Tipo de burrito</label>
            <select
              className="input input-full"
              value={recetaSel}
              onChange={(e) => setRecetaSel(e.target.value)}
            >
              <option value="">Seleccionar receta…</option>
              {recetas.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.nombre} — {formatCOP(r.precio)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad</label>
            <input
              className="input input-full"
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={esCombo}
                onChange={(e) => setEsCombo(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              ¿Es combo? (+15%)
            </label>
          </div>

          <div
            style={{
              background: 'var(--surface2)',
              borderRadius: 10,
              padding: 14,
              fontSize: 13,
            }}
          >
            {preview ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Precio unitario</span>
                  <span>
                    {formatCOP(preview.precioUnitario)}
                    {preview.esCombo && <Badge color="orange">+combo 15%</Badge>}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--orange)' }}>{formatCOP(preview.total)}</span>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>
                Selecciona un burrito para ver el precio
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={registrar}
            disabled={registrando}
          >
            🧾 {registrando ? 'Confirmando…' : 'Confirmar Venta'}
          </button>
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Historial de Ventas</h3>
          {esAdmin && (
            <div className="card-actions">
              <input
                className="input"
                type="date"
                style={{ width: 135 }}
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
              <input
                className="input"
                type="date"
                style={{ width: 135 }}
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => cargarVentas()}>
                🔍 Filtrar
              </button>
            </div>
          )}
        </div>
        <div className="table-wrap">
          {!esAdmin ? (
            <Empty icon="🔒">Solo para administradores</Empty>
          ) : cargando ? (
            <Loader />
          ) : ventas.length === 0 ? (
            <Empty icon="🧾">Sin ventas en el período</Empty>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Burrito</th>
                  <th>Cant.</th>
                  <th>Combo</th>
                  <th>Total</th>
                  <th>Cajero</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <strong>{v.tipo_burrito}</strong>
                    </td>
                    <td>{v.cantidad}</td>
                    <td>
                      {v.es_combo ? (
                        <Badge color="orange">Combo</Badge>
                      ) : (
                        <Badge color="gray">Normal</Badge>
                      )}
                    </td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                      {formatCOP(v.total)}
                    </td>
                    <td>{typeof v.usuario === 'object' ? v.usuario.nombre : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatFecha(v.createdAt)}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => anular(v._id)}>
                        Anular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
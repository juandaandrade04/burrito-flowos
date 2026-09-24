// ─────────────────────────────────────────────
//  Dashboard: stats + alertas + últimas ventas
// ─────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { InsumosResponse, Venta, VentasResponse } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { formatCOP } from '@/lib/format'
import { Empty, Loader } from '@/components/ui'

interface Stats {
  ventas: string
  burritos: number
  insumos: number
  alertas: number
}

export default function DashboardPage() {
  const { esAdmin } = useAuth()
  const { toast } = useToast()
  const [cargando, setCargando] = useState(true)
  const [stats, setStats] = useState<Stats>({ ventas: '—', burritos: 0, insumos: 0, alertas: 0 })
  const [recientes, setRecientes] = useState<Venta[]>([])
  const [alertas, setAlertas] = useState<InsumosResponse['insumos']>([])
  const [sinVentas, setSinVentas] = useState(false)
  const [noAdmin, setNoAdmin] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const hoy = new Date().toISOString().split('T')[0]

      const [insData, ventasData] = await Promise.all([
        api<InsumosResponse>('GET', '/insumos'),
        esAdmin ? api<VentasResponse>('GET', `/ventas?desde=${hoy}&hasta=${hoy}`) : null,
      ])

      const listaAlertas = insData.insumos.filter((i) => i.alerta_stock)

      setStats((prev) => ({
        ...prev,
        insumos: insData.total,
        alertas: listaAlertas.length,
      }))
      setAlertas(listaAlertas)

      if (ventasData) {
        const ventasHoy = ventasData.ventas || []
        setSinVentas(ventasHoy.length === 0)
        setRecientes(ventasHoy.slice(0, 8))
        setStats((prev) => ({
          ...prev,
          ventas: formatCOP(ventasHoy.reduce((s, v) => s + v.total, 0)),
          burritos: ventasHoy.reduce((s, v) => s + v.cantidad, 0),
        }))
      } else {
        setNoAdmin(true)
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error cargando el dashboard', 'error')
    } finally {
      setCargando(false)
    }
  }, [esAdmin, toast])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orange">💰</div>
          <div>
            <div className="stat-value">{stats.ventas}</div>
            <div className="stat-label">Ventas del día</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🌯</div>
          <div>
            <div className="stat-value">{stats.burritos}</div>
            <div className="stat-label">Burritos vendidos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div>
            <div className="stat-value">{stats.insumos}</div>
            <div className="stat-label">Insumos en stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>
          <div>
            <div className="stat-value">{stats.alertas}</div>
            <div className="stat-label">Alertas de stock</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3>⚠️ Insumos con stock bajo</h3>
          </div>
          {cargando ? (
            <Loader />
          ) : alertas.length === 0 ? (
            <Empty icon="✅">Todo el inventario está bien</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Actual</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((i) => (
                    <tr key={i._id}>
                      <td>{i.nombre}</td>
                      <td style={{ color: 'var(--red)' }}>
                        {i.cantidad_actual} {i.unidad_medida}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {i.stock_minimo} {i.unidad_medida}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>🧾 Últimas ventas</h3>
          </div>
          {cargando ? (
            <Loader />
          ) : noAdmin ? (
            <Empty icon="🔒">Solo para administradores</Empty>
          ) : sinVentas ? (
            <Empty icon="🧾">Sin ventas hoy aún</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Burrito</th>
                    <th>Cant.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((v) => (
                    <tr key={v._id}>
                      <td>{v.tipo_burrito}</td>
                      <td>{v.cantidad}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                        {formatCOP(v.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
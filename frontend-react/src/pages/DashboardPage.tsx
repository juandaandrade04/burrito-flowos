// ─────────────────────────────────────────────
//  Dashboard: stats + alertas + últimas ventas
// ─────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { graphql } from '@/lib/api'
import type { Insumo, Venta } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { formatCOP } from '@/lib/format'
import { Empty, Loader } from '@/components/ui'

interface DashboardData {
  inventario: {
    totalInsumos: number
    totalAlertas: number
    alertas: Pick<Insumo, '_id' | 'nombre' | 'cantidad_actual' | 'stock_minimo' | 'unidad_medida'>[]
  }
  ventasHoy: {
    totalVentas: number
    burritosVendidos: number
    recientes: Pick<Venta, '_id' | 'tipo_burrito' | 'cantidad' | 'total'>[]
  } | null
}

const DASHBOARD_QUERY = `
  query Dashboard {
    dashboard {
      inventario {
        totalInsumos
        totalAlertas
        alertas { _id nombre cantidad_actual stock_minimo unidad_medida }
      }
      ventasHoy {
        totalVentas
        burritosVendidos
        recientes { _id tipo_burrito cantidad total }
      }
    }
  }
`

export default function DashboardPage() {
  const { toast } = useToast()
  const [cargando, setCargando] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    let activo = true
    graphql<{ dashboard: DashboardData }>(DASHBOARD_QUERY)
      .then((data) => {
        if (activo) setDashboard(data.dashboard)
      })
      .catch((e: unknown) => {
        if (activo) toast(e instanceof Error ? e.message : 'Error cargando el dashboard', 'error')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [toast])

  if (cargando) return <Loader />
  if (!dashboard) return <Empty icon="⚠️">No se pudo cargar el tablero</Empty>
  const { inventario, ventasHoy } = dashboard

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orange">💰</div>
          <div>
            <div className="stat-value">{ventasHoy ? formatCOP(ventasHoy.totalVentas) : '—'}</div>
            <div className="stat-label">Ventas del día</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🌯</div>
          <div>
            <div className="stat-value">{ventasHoy?.burritosVendidos ?? '—'}</div>
            <div className="stat-label">Burritos vendidos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div>
            <div className="stat-value">{inventario.totalInsumos}</div>
            <div className="stat-label">Insumos en stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>
          <div>
            <div className="stat-value">{inventario.totalAlertas}</div>
            <div className="stat-label">Alertas de stock</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3>⚠️ Insumos con stock bajo</h3>
          </div>
          {inventario.alertas.length === 0 ? (
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
                  {inventario.alertas.map((i) => (
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
          {!ventasHoy ? (
            <Empty icon="🔒">Solo para administradores</Empty>
          ) : ventasHoy.recientes.length === 0 ? (
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
                  {ventasHoy.recientes.map((v) => (
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

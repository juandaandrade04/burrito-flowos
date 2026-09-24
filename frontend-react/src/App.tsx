// ─────────────────────────────────────────────
//  App: definición de rutas
// ─────────────────────────────────────────────
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import { RequireAdmin, RequireAuth } from '@/components/RequireAuth'
import DashboardPage from '@/pages/DashboardPage'
import InsumosPage from '@/pages/InsumosPage'
import LoginPage from '@/pages/LoginPage'
import RecetasPage from '@/pages/RecetasPage'
import UsuariosPage from '@/pages/UsuariosPage'
import VentasPage from '@/pages/VentasPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/insumos" element={<InsumosPage />} />
          <Route path="/recetas" element={<RecetasPage />} />
          <Route
            path="/usuarios"
            element={
              <RequireAdmin>
                <UsuariosPage />
              </RequireAdmin>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  )
}
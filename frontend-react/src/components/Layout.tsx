// ─────────────────────────────────────────────
//  Layout principal: sidebar + topbar + contenido
// ─────────────────────────────────────────────
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { iniciales } from '@/lib/format'

interface Pagina {
  ruta: string
  titulo: string
  sub: string
  icono: string
  adminOnly?: boolean
}

const PAGINAS: Pagina[] = [
  { ruta: '/dashboard', titulo: 'Dashboard', sub: 'Resumen general del sistema', icono: '📊' },
  { ruta: '/ventas', titulo: 'Ventas', sub: 'Registro e historial de ventas', icono: '🧾' },
  { ruta: '/insumos', titulo: 'Inventario', sub: 'Control de insumos y stock', icono: '📦' },
  { ruta: '/recetas', titulo: 'Recetas', sub: 'Menú de burritos y sus recetas', icono: '📋' },
  { ruta: '/usuarios', titulo: 'Usuarios', sub: 'Administración de accesos', icono: '👥', adminOnly: true },
]

export default function Layout() {
  const { usuario, esAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const pagina = PAGINAS.find((p) => location.pathname.startsWith(p.ruta))

  const manejarLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span>🌯</span>
          <div>
            <h2>
              Burrito <em>FlowOS</em>
            </h2>
            <p>Sistema de Gestión</p>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section">Principal</div>
          <NavLink to="/dashboard" className="nav-item" onClick={() => setMenuAbierto(false)}>
            <span className="icon">📊</span> Dashboard
          </NavLink>

          <div className="nav-section">Operaciones</div>
          <NavLink to="/ventas" className="nav-item" onClick={() => setMenuAbierto(false)}>
            <span className="icon">🧾</span> Ventas
          </NavLink>
          <NavLink to="/insumos" className="nav-item" onClick={() => setMenuAbierto(false)}>
            <span className="icon">📦</span> Inventario
          </NavLink>
          <NavLink to="/recetas" className="nav-item" onClick={() => setMenuAbierto(false)}>
            <span className="icon">📋</span> Recetas
          </NavLink>

          {esAdmin && (
            <>
              <div className="nav-section">Administración</div>
              <NavLink to="/usuarios" className="nav-item" onClick={() => setMenuAbierto(false)}>
                <span className="icon">👥</span> Usuarios
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{iniciales(usuario?.nombre ?? '?')}</div>
            <div>
              <div className="user-name">{usuario?.nombre ?? '—'}</div>
              <div className="user-role">{usuario?.rol ?? '—'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={manejarLogout}>
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <button
        className="btn btn-secondary btn-sm btn-ico"
        style={{ position: 'fixed', left: 10, top: 10, zIndex: 200 }}
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>{pagina?.titulo ?? 'Burrito FlowOS'}</h1>
            <p>{pagina?.sub ?? ''}</p>
          </div>
          <div className="topbar-actions" />
        </div>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
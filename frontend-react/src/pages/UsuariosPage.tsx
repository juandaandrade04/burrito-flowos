// ─────────────────────────────────────────────
//  Usuarios: CRUD (solo administrador)
// ─────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Rol, Usuario, UsuariosResponse } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/Modal'
import { Badge, Empty, Loader } from '@/components/ui'

interface FormState {
  id: string
  nombre: string
  email: string
  password: string
  rol: Rol
}

const FORM_VACIO: FormState = { id: '', nombre: '', email: '', password: '', rol: 'cajero' }

export default function UsuariosPage() {
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await api<UsuariosResponse>('GET', '/usuarios')
      setUsuarios(data.usuarios || [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error cargando usuarios', 'error')
    } finally {
      setCargando(false)
    }
  }, [toast])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirNuevo = () => {
    setForm({ ...FORM_VACIO, email: '', rol: 'cajero' })
    setModal(true)
  }

  const abrirEditar = (u: Usuario) => {
    setForm({ id: u._id, nombre: u.nombre, email: u.email, password: '', rol: u.rol })
    setModal(true)
  }

  const guardar = async () => {
    const esNuevo = !form.id
    if (!form.nombre.trim()) {
      toast('El nombre es obligatorio.', 'error')
      return
    }
    if (esNuevo && (!form.email.trim() || !form.password)) {
      toast('Email y contraseña son obligatorios.', 'error')
      return
    }

    const cuerpo: Record<string, unknown> = { nombre: form.nombre.trim(), rol: form.rol }
    if (esNuevo) {
      cuerpo.email = form.email.trim()
      cuerpo.password = form.password
    } else if (form.password) {
      cuerpo.password = form.password
    }

    setGuardando(true)
    try {
      if (esNuevo) {
        await api('POST', '/usuarios', cuerpo)
        toast('Usuario creado.')
      } else {
        await api('PUT', `/usuarios/${form.id}`, cuerpo)
        toast('Usuario actualizado.')
      }
      setModal(false)
      cargar()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error guardando usuario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (u: Usuario) => {
    if (!window.confirm(`¿Eliminar al usuario "${u.nombre}"?`)) return
    try {
      await api('DELETE', `/usuarios/${u._id}`)
      toast('Usuario eliminado.')
      cargar()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error eliminando usuario', 'error')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>👥 Gestión de Usuarios</h3>
        <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>
          ➕ Nuevo usuario
        </button>
      </div>

      <div className="table-wrap">
        {cargando ? (
          <Loader />
        ) : usuarios.length === 0 ? (
          <Empty icon="👥">Sin usuarios</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.nombre}</strong>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <Badge color={u.rol === 'administrador' ? 'orange' : 'blue'}>
                      {u.rol}
                    </Badge>
                  </td>
                  <td>
                    <Badge color={u.activo ? 'green' : 'red'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(u)}>
                        ✏️
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(u)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal}
        titulo={form.id ? 'Editar Usuario' : 'Nuevo Usuario'}
        onClose={() => setModal(false)}
      >
        <div className="modal-body">
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              className="input input-full"
              placeholder="Karen Botero"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              className="input input-full"
              type="email"
              placeholder="usuario@burritoflowos.com"
              value={form.email}
              disabled={Boolean(form.id)}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {form.id && (
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                El email no se puede cambiar al editar.
              </span>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                Contraseña{' '}
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                  {form.id ? '(dejar vacío para no cambiar)' : '(obligatoria)'}
                </span>
              </label>
              <input
                className="input input-full"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select
                className="input input-full"
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
              >
                <option value="cajero">Cajero</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
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
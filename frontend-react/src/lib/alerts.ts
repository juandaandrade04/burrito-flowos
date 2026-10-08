// ─────────────────────────────────────────────
//  Alertas modales con SweetAlert2
// ─────────────────────────────────────────────
import Swal from 'sweetalert2'

const NARANJA = '#e07b39'

// Confirmación tipo "sí / cancelar". Devuelve true si el usuario confirma.
export async function confirmar(mensaje: string): Promise<boolean> {
  const { isConfirmed } = await Swal.fire({
    icon: 'warning',
    title: mensaje,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: NARANJA,
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
  })
  return isConfirmed
}

// Aviso mostrado al cerrar sesión.
export async function alertaSesionCerrada(): Promise<void> {
  await Swal.fire({
    icon: 'success',
    title: 'Se ha cerrado la sesión',
    text: 'Por favor vuelva a ingresar',
    confirmButtonText: 'Aceptar',
    confirmButtonColor: NARANJA,
  })
}
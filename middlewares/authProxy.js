// middlewares/authProxy.js
// Deriva /api/v1/auth/* hacia el auth-service independiente.
// Gestiona la sesión de express-session: se crea al hacer login y se destruye al hacer logout.
const express = require('express');
const router  = express.Router();

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://localhost:4002';

const COOKIE_SESION = 'bf.sid';

router.use(async (req, res) => {
  try {
    // ── GET /api/v1/auth/sesion ──────────────────
    // Devuelve el usuario de la sesión actual (o 401 si no hay sesión).
    // Lo consume el frontend al recargar para restaurar la identidad
    // sin guardar nada en el navegador.
    if (req.method === 'GET' && req.path === '/sesion') {
      if (!req.session || !req.session.usuario) {
        return res.status(401).json({
          error: {
            codigo:    401,
            mensaje:   'No hay una sesión activa.',
            timestamp: new Date().toISOString()
          }
        });
      }
      return res.status(200).json({ usuario: req.session.usuario });
    }

    const target  = `${AUTH_SERVICE_URL}/api/v1/auth${req.url}`;
    const headers = { 'Content-Type': 'application/json' };

    // El token ya NO viaja desde el cliente: se toma de la sesión del servidor.
    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'];
    } else if (req.session && req.session.token) {
      headers['Authorization'] = `Bearer ${req.session.token}`;
    }

    const esBody  = !['GET', 'HEAD'].includes(req.method);
    const options = { method: req.method, headers };
    if (esBody) options.body = JSON.stringify(req.body || {});

    const response = await fetch(target, options);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    // ── Crear la sesión local al iniciar sesión ──
    // El JWT se guarda SOLO en la sesión del servidor (nunca en el navegador).
    if (req.path === '/login' && response.status === 200 && data.usuario) {
      req.session.usuario = {
        id:     data.usuario.id,
        nombre: data.usuario.nombre,
        email:  data.usuario.email,
        rol:    data.usuario.rol
      };
      req.session.token = data.token;

      // Se elimina el token de la respuesta para no exponerlo al cliente.
      delete data.token;
    }

    // ── Destruir la sesión al cerrar sesión ──
    // (aunque auth-service no responda 200, la sesión local debe destruirse)
    if (req.path === '/logout' && req.session) {
      req.session.destroy(() => {});
      // Express borra la sesión del servidor pero NO limpia la cookie
      // del navegador; hay que expirarla explícitamente.
      res.clearCookie(COOKIE_SESION, { path: '/' });
    }

    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({
      error: {
        codigo:    502,
        mensaje:   'Servicio de autenticación no disponible. Verifique que auth-service esté corriendo.',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
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
    const target  = `${AUTH_SERVICE_URL}/api/v1/auth${req.url}`;
    const headers = { 'Content-Type': 'application/json' };

    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'];
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
    if (req.path === '/login' && response.status === 200 && data.usuario) {
      req.session.usuario = {
        id:     data.usuario.id,
        nombre: data.usuario.nombre,
        email:  data.usuario.email,
        rol:    data.usuario.rol
      };
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
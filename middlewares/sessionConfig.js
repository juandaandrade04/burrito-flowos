// middlewares/sessionConfig.js
// Configuración de express-session para el gateway.
// Controla el inicio de sesión del usuario mediante cookies firmadas.
const session = require('express-session');

const sessionMiddleware = session({
  name: 'bf.sid',
  secret: process.env.SESSION_SECRET || 'burrito_flowos_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true solo en producción con HTTPS
    maxAge: 1000 * 60 * 60 * 8 // 8 horas
  }
});

module.exports = sessionMiddleware;
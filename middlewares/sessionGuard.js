// middlewares/sessionGuard.js
// Protege rutas API exigiendo una sesión activa de express-session.
const sessionGuard = (req, res, next) => {
  if (req.session && req.session.usuario && req.session.usuario.id) {
    return next();
  }
  return res.status(401).json({
    error: {
      codigo:    401,
      mensaje:   'Acceso denegado. No hay una sesión activa. Inicie sesión.',
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = sessionGuard;
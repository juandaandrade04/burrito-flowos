// middlewares/checkRole.js
// Uso: checkRole('administrador')  o  checkRole('administrador','cajero')

const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: { codigo: 401, mensaje: 'No autenticado.', timestamp: new Date().toISOString() }
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: {
          codigo:    403,
          mensaje:   `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}.`,
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

module.exports = checkRole;

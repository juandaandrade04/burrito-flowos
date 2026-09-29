const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        codigo: 401,
        mensaje: 'Acceso denegado. Token no proporcionado.',
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    req.usuario = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch (err) {
    const mensaje = err.name === 'TokenExpiredError'
      ? 'El token ha expirado. Inicie sesión nuevamente.'
      : 'Token inválido o malformado.';

    return res.status(401).json({
      error: {
        codigo: 401,
        mensaje,
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = verifyToken;
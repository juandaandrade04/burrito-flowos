// middlewares/verifyToken.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        codigo:    401,
        mensaje:   'Acceso denegado. Token no proporcionado.',
        timestamp: new Date().toISOString()
      }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded  = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario    = decoded;   // { id, nombre, email, rol, iat, exp }
    next();
  } catch (err) {
    const mensaje = err.name === 'TokenExpiredError'
      ? 'El token ha expirado. Inicie sesión nuevamente.'
      : 'Token inválido o malformado.';

    return res.status(401).json({
      error: {
        codigo:    401,
        mensaje,
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = verifyToken;

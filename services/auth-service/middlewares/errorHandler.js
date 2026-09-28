// middlewares/errorHandler.js — Manejador centralizado de errores
const errorHandler = (err, req, res, next) => {
  console.error('❌ ERROR:', err.message);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: {
        codigo:    400,
        mensaje:   'Error de validación',
        detalles:  mensajes,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Duplicate key (email único, etc.)
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: {
        codigo:    400,
        mensaje:   `El valor del campo '${campo}' ya existe.`,
        timestamp: new Date().toISOString()
      }
    });
  }

  // CastError (ID inválido en MongoDB)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        codigo:    400,
        mensaje:   'ID con formato inválido.',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      codigo:    status,
      mensaje:   err.message || 'Error interno del servidor',
      ruta:      req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = errorHandler;

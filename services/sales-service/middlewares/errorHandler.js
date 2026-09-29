const errorHandler = (err, req, res, next) => {
  console.error('[sales-service] ERROR:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        codigo: 400,
        mensaje: 'Error de validación',
        detalles: Object.values(err.errors).map(error => error.message),
        timestamp: new Date().toISOString()
      }
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        codigo: 400,
        mensaje: 'ID con formato inválido.',
        timestamp: new Date().toISOString()
      }
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      codigo: status,
      mensaje: err.message || 'Error interno del servidor',
      ruta: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = errorHandler;
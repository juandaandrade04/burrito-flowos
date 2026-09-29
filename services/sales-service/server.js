// services/sales-service/server.js
// Carga su propio .env para poder arrancar desde cualquier directorio.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const ventasRoutes = require('./routes/ventas.routes');

// Registra el modelo requerido por populate('usuario').
require('./models/Usuario');

const app = express();
const PORT = process.env.PORT || 4004;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1/ventas', ventasRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ servicio: 'sales-service', estado: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({
    error: {
      codigo: 404,
      mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString()
    }
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[sales-service] Servidor: http://localhost:${PORT}`);
  console.log('[sales-service] API Base: /api/v1/ventas');
});

module.exports = app;
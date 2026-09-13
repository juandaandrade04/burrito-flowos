// services/inventory-service/server.js
// ├─ Burrito FlowOS — inventory-service (Insumos)
// Carga SIEMPRE su propio .env (independiente del cwd desde donde se invoque)
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');

const connectDB      = require('./config/database');
const errorHandler   = require('./middlewares/errorHandler');
const insumosRoutes  = require('./routes/insumos.routes');

const app  = express();
const PORT = process.env.PORT || 4001;

// ── Conexión a base de datos ──────────────────
connectDB();

// ── Middlewares globales ──────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rutas API v1 ─────────────────────────────
app.use('/api/v1/insumos', insumosRoutes);

// ── Health check ──────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ servicio: 'inventory-service', estado: 'ok' });
});

// ── Ruta 404 ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      codigo:    404,
      mensaje:   `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString()
    }
  });
});

// ── Manejador global de errores ───────────────
app.use(errorHandler);

// ── Inicio del servidor ───────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   🌯  Burrito FlowOS + inventory      ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Servidor:  http://localhost:${PORT}     ║`);
  console.log('║  API Base:  /api/v1/insumos          ║');
  console.log(`║  Entorno:   ${process.env.NODE_ENV || 'development'}               ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;
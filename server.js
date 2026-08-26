// ─────────────────────────────────────────────
//  Burrito FlowOS — server.js
//  Punto de entrada principal de la aplicación
// ─────────────────────────────────────────────
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const path     = require('path');

const connectDB      = require('./config/database');
const errorHandler   = require('./middlewares/errorHandler');

// Rutas
const authRoutes     = require('./routes/auth.routes');
const insumosRoutes  = require('./routes/insumos.routes');
const ventasRoutes   = require('./routes/ventas.routes');
const recetasRoutes  = require('./routes/recetas.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Conexión a base de datos ──────────────────
connectDB();

// ── Middlewares globales ──────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Archivos estáticos (frontend) ────────────
app.use(express.static(path.join(__dirname, 'frontend')));

// ── Rutas API v1 ─────────────────────────────
app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/insumos',  insumosRoutes);
app.use('/api/v1/ventas',   ventasRoutes);
app.use('/api/v1/recetas',  recetasRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);

// ── Ruta raíz → frontend ─────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
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
  console.log('║        🌯  Burrito FlowOS            ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Servidor:  http://localhost:${PORT}     ║`);
  console.log(`║  API Base:  /api/v1/                 ║`);
  console.log(`║  Entorno:   ${process.env.NODE_ENV || 'development'}               ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;

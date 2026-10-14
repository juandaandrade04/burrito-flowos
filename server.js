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
const sessionMW      = require('./middlewares/sessionConfig');
const sessionGuard   = require('./middlewares/sessionGuard');

// Rutas
const authProxy      = require('./middlewares/authProxy');
const insumosProxy   = require('./middlewares/insumosProxy');
const recetasProxy   = require('./middlewares/recetasProxy');
const ventasProxy    = require('./middlewares/ventasProxy');
const usuariosRoutes = require('./routes/usuarios.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Conexión a base de datos ──────────────────
connectDB();

// ── Middlewares globales ──────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMW); // express-session: controla el inicio de sesión
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Frontend (React) ──────────────────────────
// El build de React vive en frontend-react/dist (generado con `npm --prefix frontend-react run build`).
const DIR_FRONTEND = path.join(__dirname, 'frontend-react', 'dist');
app.use(express.static(DIR_FRONTEND));

// ── Rutas API v1 ─────────────────────────────
app.use('/api/v1/auth',     authProxy);          // → auth-service (login/logout gestionan la sesión)
app.use('/api/v1/insumos',  sessionGuard, insumosProxy);       // → inventory-service
app.use('/api/v1/ventas',   sessionGuard, ventasProxy);        // → sales-service
app.use('/api/v1/recetas',  sessionGuard, recetasProxy);       // → recetas-service
app.use('/api/v1/usuarios', sessionGuard, usuariosRoutes);

// ── Ruta raíz → frontend (React SPA) ─────────
app.get('/', (req, res) => {
  res.sendFile(path.join(DIR_FRONTEND, 'index.html'));
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

// routes/insumos.routes.js
const router      = require('express').Router();
const InsumoCtrl  = require('../controllers/InsumoController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole   = require('../middlewares/checkRole');

// Todos los endpoints de insumos requieren autenticación
router.use(verifyToken);

// GET  /api/v1/insumos       → admin y cajero pueden consultar
router.get('/',    checkRole('administrador', 'cajero'), InsumoCtrl.listar);

// GET  /api/v1/insumos/:id
router.get('/:id', checkRole('administrador', 'cajero'), InsumoCtrl.obtener);

// POST /api/v1/insumos       → solo admin
router.post('/',   checkRole('administrador'), InsumoCtrl.crear);

// PUT  /api/v1/insumos/:id
router.put('/:id', checkRole('administrador'), InsumoCtrl.actualizar);

// DELETE /api/v1/insumos/:id
router.delete('/:id', checkRole('administrador'), InsumoCtrl.eliminar);

module.exports = router;

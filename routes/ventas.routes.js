// routes/ventas.routes.js
const router      = require('express').Router();
const VentaCtrl   = require('../controllers/VentaController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole   = require('../middlewares/checkRole');

router.use(verifyToken);

// POST /api/v1/ventas        → admin y cajero
router.post('/',    checkRole('administrador', 'cajero'), VentaCtrl.registrar);

// GET  /api/v1/ventas        → solo admin
router.get('/',     checkRole('administrador'), VentaCtrl.listar);

// GET  /api/v1/ventas/:id
router.get('/:id',  checkRole('administrador'), VentaCtrl.obtener);

// DELETE /api/v1/ventas/:id  → solo admin (anular)
router.delete('/:id', checkRole('administrador'), VentaCtrl.anular);

module.exports = router;

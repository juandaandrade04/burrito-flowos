// routes/recetas.routes.js
const router      = require('express').Router();
const RecetaCtrl  = require('../controllers/RecetaController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole   = require('../middlewares/checkRole');

router.use(verifyToken);

// GET /api/v1/recetas        → admin y cajero
router.get('/',    checkRole('administrador', 'cajero'), RecetaCtrl.listar);
router.get('/:id', checkRole('administrador', 'cajero'), RecetaCtrl.obtener);

// Modificar recetas: solo admin
router.post('/',      checkRole('administrador'), RecetaCtrl.crear);
router.put('/:id',    checkRole('administrador'), RecetaCtrl.actualizar);
router.delete('/:id', checkRole('administrador'), RecetaCtrl.eliminar);

module.exports = router;

// routes/usuarios.routes.js
const router        = require('express').Router();
const UsuarioCtrl   = require('../controllers/UsuarioController');
const verifyToken   = require('../middlewares/verifyToken');
const checkRole     = require('../middlewares/checkRole');

router.use(verifyToken);
router.use(checkRole('administrador'));   // solo admin gestiona usuarios

router.get('/',       UsuarioCtrl.listar);
router.get('/:id',    UsuarioCtrl.obtener);
router.post('/',      UsuarioCtrl.crear);
router.put('/:id',    UsuarioCtrl.actualizar);
router.delete('/:id', UsuarioCtrl.eliminar);

module.exports = router;

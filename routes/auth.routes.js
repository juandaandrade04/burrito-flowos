// routes/auth.routes.js
const router      = require('express').Router();
const AuthCtrl    = require('../controllers/AuthController');
const verifyToken = require('../middlewares/verifyToken');

// POST /api/v1/auth/login   → público
router.post('/login',  AuthCtrl.login);

// POST /api/v1/auth/logout  → protegido
router.post('/logout', verifyToken, AuthCtrl.logout);

// GET  /api/v1/auth/perfil  → protegido (cualquier rol)
router.get('/perfil',  verifyToken, AuthCtrl.perfil);

module.exports = router;

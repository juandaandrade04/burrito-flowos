// controllers/AuthController.js
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const Usuario = require('../models/Usuario');

// ── POST /api/v1/auth/login ───────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { codigo: 400, mensaje: 'Email y contraseña son obligatorios.' }
      });
    }

    // Buscar usuario (incluir password_hash que está oculto por defecto)
    const usuario = await Usuario.findOne({ email: email.toLowerCase(), activo: true })
                                 .select('+password_hash');

    if (!usuario) {
      return res.status(401).json({
        error: { codigo: 401, mensaje: 'Credenciales incorrectas.' }
      });
    }

    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return res.status(401).json({
        error: { codigo: 401, mensaje: 'Credenciales incorrectas.' }
      });
    }

    // Generar JWT
    const payload = {
      id:     usuario._id,
      nombre: usuario.nombre,
      email:  usuario.email,
      rol:    usuario.rol
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id:     usuario._id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol
      },
      expira_en: process.env.JWT_EXPIRES_IN || '8h'
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/auth/logout ──────────────────
// (JWT es stateless; el cliente simplemente elimina el token)
exports.logout = async (req, res) => {
  res.status(200).json({
    mensaje: 'Sesión cerrada exitosamente. Elimine el token del cliente.'
  });
};

// ── GET /api/v1/auth/perfil ───────────────────
exports.perfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: { codigo: 404, mensaje: 'Usuario no encontrado.' } });
    }
    res.status(200).json({ usuario });
  } catch (err) {
    next(err);
  }
};

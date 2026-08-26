// controllers/UsuarioController.js
const bcrypt  = require('bcryptjs');
const Usuario = require('../models/Usuario');

// ── GET /api/v1/usuarios ──────────────────────
exports.listar = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find({ activo: true }).sort({ nombre: 1 });
    res.status(200).json({ total: usuarios.length, usuarios });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/usuarios/:id ──────────────────
exports.obtener = async (req, res, next) => {
  try {
    const usuario = await Usuario.findOne({ _id: req.params.id, activo: true });
    if (!usuario) {
      return res.status(404).json({ error: { codigo: 404, mensaje: 'Usuario no encontrado.' } });
    }
    res.status(200).json({ usuario });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/usuarios ─────────────────────
exports.crear = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: { codigo: 400, mensaje: 'nombre, email y password son obligatorios.' }
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({
      nombre,
      email,
      password_hash: hash,
      rol: rol || 'cajero'
    });

    res.status(201).json({
      mensaje:     'Usuario creado exitosamente',
      usuario_id:  usuario._id,
      usuario
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/v1/usuarios/:id ──────────────────
exports.actualizar = async (req, res, next) => {
  try {
    const campos = {};
    if (req.body.nombre) campos.nombre = req.body.nombre;
    if (req.body.rol)    campos.rol    = req.body.rol;
    if (req.body.activo !== undefined) campos.activo = req.body.activo;

    if (req.body.password) {
      campos.password_hash = await bcrypt.hash(req.body.password, 10);
    }

    const usuario = await Usuario.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      campos,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({ error: { codigo: 404, mensaje: 'Usuario no encontrado.' } });
    }

    res.status(200).json({ mensaje: 'Usuario actualizado', usuario });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/v1/usuarios/:id ───────────────
exports.eliminar = async (req, res, next) => {
  try {
    // No permitir que un admin se elimine a sí mismo
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({
        error: { codigo: 400, mensaje: 'No puedes eliminar tu propia cuenta.' }
      });
    }

    const usuario = await Usuario.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { activo: false },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ error: { codigo: 404, mensaje: 'Usuario no encontrado.' } });
    }

    res.status(200).json({ mensaje: `Usuario '${usuario.nombre}' eliminado exitosamente.` });
  } catch (err) {
    next(err);
  }
};

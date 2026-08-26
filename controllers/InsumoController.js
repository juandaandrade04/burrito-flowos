// controllers/InsumoController.js
const Insumo = require('../models/Insumo');

// ── GET /api/v1/insumos ───────────────────────
exports.listar = async (req, res, next) => {
  try {
    const { nombre, alerta } = req.query;
    const filtro = { activo: true };

    if (nombre) {
      filtro.nombre = { $regex: nombre, $options: 'i' };
    }

    const insumos = await Insumo.find(filtro).sort({ nombre: 1 });

    // Filtrar por alerta de stock si se pide
    const resultado = alerta === 'true'
      ? insumos.filter(i => i.alerta_stock)
      : insumos;

    res.status(200).json({
      total:   resultado.length,
      insumos: resultado
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/insumos/:id ───────────────────
exports.obtener = async (req, res, next) => {
  try {
    const insumo = await Insumo.findOne({ _id: req.params.id, activo: true });
    if (!insumo) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Insumo no encontrado.' }
      });
    }
    res.status(200).json({ insumo });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/insumos ──────────────────────
exports.crear = async (req, res, next) => {
  try {
    const { nombre, cantidad_actual, unidad_medida, stock_minimo } = req.body;

    const insumo = await Insumo.create({
      nombre,
      cantidad_actual,
      unidad_medida,
      stock_minimo: stock_minimo || 0
    });

    res.status(201).json({
      mensaje:    'Insumo creado exitosamente',
      insumo_id:  insumo._id,
      insumo
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/v1/insumos/:id ───────────────────
exports.actualizar = async (req, res, next) => {
  try {
    const campos = {};
    const permitidos = ['nombre', 'cantidad_actual', 'unidad_medida', 'stock_minimo'];
    permitidos.forEach(k => { if (req.body[k] !== undefined) campos[k] = req.body[k]; });

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({
        error: { codigo: 400, mensaje: 'No se enviaron campos para actualizar.' }
      });
    }

    const insumo = await Insumo.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      campos,
      { new: true, runValidators: true }
    );

    if (!insumo) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Insumo no encontrado.' }
      });
    }

    res.status(200).json({ mensaje: 'Insumo actualizado', insumo });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/v1/insumos/:id ────────────────
exports.eliminar = async (req, res, next) => {
  try {
    const insumo = await Insumo.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { activo: false },
      { new: true }
    );

    if (!insumo) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Insumo no encontrado.' }
      });
    }

    res.status(200).json({ mensaje: `Insumo '${insumo.nombre}' eliminado exitosamente.` });
  } catch (err) {
    next(err);
  }
};

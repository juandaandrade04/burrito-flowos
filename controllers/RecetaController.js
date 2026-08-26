// controllers/RecetaController.js
const Receta = require('../models/Receta');
const Insumo = require('../models/Insumo');

// ── GET /api/v1/recetas ───────────────────────
exports.listar = async (req, res, next) => {
  try {
    const recetas = await Receta.find({ activo: true })
      .populate('ingredientes.insumo', 'nombre unidad_medida cantidad_actual')
      .sort({ nombre: 1 });

    res.status(200).json({ total: recetas.length, recetas });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/recetas/:id ───────────────────
exports.obtener = async (req, res, next) => {
  try {
    const receta = await Receta.findOne({ _id: req.params.id, activo: true })
      .populate('ingredientes.insumo', 'nombre unidad_medida cantidad_actual alerta_stock');

    if (!receta) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Receta no encontrada.' }
      });
    }
    res.status(200).json({ receta });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/recetas ──────────────────────
exports.crear = async (req, res, next) => {
  try {
    const { nombre, precio, descripcion, ingredientes } = req.body;

    // Validar que todos los insumos existen
    if (Array.isArray(ingredientes)) {
      for (const ing of ingredientes) {
        const existe = await Insumo.findOne({ _id: ing.insumo, activo: true });
        if (!existe) {
          return res.status(404).json({
            error: { codigo: 404, mensaje: `Insumo con ID '${ing.insumo}' no encontrado.` }
          });
        }
      }
    }

    const receta = await Receta.create({ nombre, precio, descripcion, ingredientes });
    await receta.populate('ingredientes.insumo', 'nombre unidad_medida');

    res.status(201).json({
      mensaje:    'Receta creada exitosamente',
      receta_id:  receta._id,
      receta
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/v1/recetas/:id ───────────────────
exports.actualizar = async (req, res, next) => {
  try {
    const campos = {};
    ['nombre', 'precio', 'descripcion', 'ingredientes'].forEach(k => {
      if (req.body[k] !== undefined) campos[k] = req.body[k];
    });

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({
        error: { codigo: 400, mensaje: 'No se enviaron campos para actualizar.' }
      });
    }

    const receta = await Receta.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      campos,
      { new: true, runValidators: true }
    ).populate('ingredientes.insumo', 'nombre unidad_medida');

    if (!receta) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Receta no encontrada.' }
      });
    }

    res.status(200).json({ mensaje: 'Receta actualizada', receta });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/v1/recetas/:id ────────────────
exports.eliminar = async (req, res, next) => {
  try {
    const receta = await Receta.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { activo: false },
      { new: true }
    );

    if (!receta) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Receta no encontrada.' }
      });
    }

    res.status(200).json({ mensaje: `Receta '${receta.nombre}' eliminada exitosamente.` });
  } catch (err) {
    next(err);
  }
};

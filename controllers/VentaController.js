// controllers/VentaController.js
const Venta  = require('../models/Venta');
const Receta = require('../models/Receta');
const Insumo = require('../models/Insumo');

// ── POST /api/v1/ventas ───────────────────────
exports.registrar = async (req, res, next) => {
  try {
    const { tipo_burrito, es_combo, cantidad } = req.body;

    if (!tipo_burrito || !cantidad) {
      return res.status(400).json({
        error: { codigo: 400, mensaje: 'tipo_burrito y cantidad son obligatorios.' }
      });
    }

    // Buscar receta activa que coincida con el nombre del burrito
    const receta = await Receta.findOne({
      nombre: { $regex: tipo_burrito, $options: 'i' },
      activo: true
    }).populate('ingredientes.insumo');

    if (!receta) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: `No existe receta activa para '${tipo_burrito}'.` }
      });
    }

    // Verificar stock suficiente para TODOS los ingredientes
    const faltantes = [];
    for (const ing of receta.ingredientes) {
      const necesario = ing.cantidad * cantidad;
      const insumo    = ing.insumo;

      if (!insumo || insumo.cantidad_actual < necesario) {
        faltantes.push({
          insumo:      insumo ? insumo.nombre : 'Desconocido',
          disponible:  insumo ? insumo.cantidad_actual : 0,
          necesario,
          unidad:      ing.unidad
        });
      }
    }

    if (faltantes.length > 0) {
      return res.status(422).json({
        error: {
          codigo:    422,
          mensaje:   'Stock insuficiente para completar la venta.',
          faltantes
        }
      });
    }

    // Descontar insumos del inventario
    const insumosDescontados = [];
    for (const ing of receta.ingredientes) {
      const descuento = ing.cantidad * cantidad;
      await Insumo.findByIdAndUpdate(
        ing.insumo._id,
        { $inc: { cantidad_actual: -descuento } }
      );
      insumosDescontados.push({
        insumo:   ing.insumo.nombre,
        cantidad: descuento,
        unidad:   ing.unidad
      });
    }

    // Calcular total (combo agrega 15% al precio base)
    const precioUnitario = es_combo
      ? Math.round(receta.precio * 1.15)
      : receta.precio;

    const total = precioUnitario * cantidad;

    // Guardar la venta
    const venta = await Venta.create({
      usuario:             req.usuario.id,
      receta:              receta._id,
      tipo_burrito:        receta.nombre,
      es_combo:            es_combo || false,
      cantidad,
      precio_unitario:     precioUnitario,
      total,
      insumos_descontados: insumosDescontados
    });

    res.status(201).json({
      mensaje:             'Venta registrada exitosamente',
      venta_id:            venta._id,
      tipo_burrito:        venta.tipo_burrito,
      cantidad,
      es_combo:            venta.es_combo,
      precio_unitario:     precioUnitario,
      total,
      insumos_descontados: insumosDescontados
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/ventas ────────────────────────
exports.listar = async (req, res, next) => {
  try {
    const { desde, hasta, tipo_burrito, page = 1, limit = 20 } = req.query;
    const filtro = { anulada: false };

    if (tipo_burrito) {
      filtro.tipo_burrito = { $regex: tipo_burrito, $options: 'i' };
    }

    if (desde || hasta) {
      filtro.createdAt = {};
      if (desde) filtro.createdAt.$gte = new Date(desde);
      if (hasta) filtro.createdAt.$lte = new Date(hasta + 'T23:59:59');
    }

    const skip  = (page - 1) * limit;
    const total = await Venta.countDocuments(filtro);

    const ventas = await Venta.find(filtro)
      .populate('usuario', 'nombre email rol')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Estadísticas básicas
    const stats = await Venta.aggregate([
      { $match: { anulada: false } },
      { $group: {
          _id:            null,
          total_ventas:   { $sum: '$total' },
          total_burritos: { $sum: '$cantidad' }
        }
      }
    ]);

    res.status(200).json({
      total,
      pagina:  Number(page),
      limite:  Number(limit),
      estadisticas: stats[0] || { total_ventas: 0, total_burritos: 0 },
      ventas
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/ventas/:id ────────────────────
exports.obtener = async (req, res, next) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('receta', 'nombre precio');

    if (!venta) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Venta no encontrada.' }
      });
    }

    res.status(200).json({ venta });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/v1/ventas/:id — Anular venta ──
exports.anular = async (req, res, next) => {
  try {
    const venta = await Venta.findOne({ _id: req.params.id, anulada: false });

    if (!venta) {
      return res.status(404).json({
        error: { codigo: 404, mensaje: 'Venta no encontrada o ya anulada.' }
      });
    }

    // Revertir descuento de insumos
    for (const det of venta.insumos_descontados) {
      const insumo = await Insumo.findOne({
        nombre: det.insumo,
        activo: true
      });
      if (insumo) {
        await Insumo.findByIdAndUpdate(insumo._id, {
          $inc: { cantidad_actual: det.cantidad }
        });
      }
    }

    venta.anulada = true;
    await venta.save();

    res.status(200).json({
      mensaje:  'Venta anulada exitosamente. Insumos devueltos al inventario.',
      venta_id: venta._id
    });
  } catch (err) {
    next(err);
  }
};

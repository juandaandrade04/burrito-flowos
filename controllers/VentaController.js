// controllers/VentaController.js
const Venta  = require('../models/Venta');
const Receta = require('../models/Receta');
const Insumo = require('../models/Insumo');
const PDFDocument = require('pdfkit');

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

// ── GET /api/v1/ventas/reporte — PDF del período ──
exports.reporteMes = async (req, res, next) => {
  try {
    const { mes, desde, hasta } = req.query;

    // Calcular rango: prioridad desde/hasta, luego mes=YYYY-MM, sino mes actual
    let inicio;
    let fin;
    if (desde && hasta) {
      inicio = new Date(desde);
      fin    = new Date(hasta + 'T23:59:59');
    } else if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      const [y, m] = mes.split('-').map(Number);
      inicio = new Date(y, m - 1, 1);
      fin    = new Date(y, m, 0, 23, 59, 59);
    } else {
      const ahora = new Date();
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      fin    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
    }

    const ventas = await Venta.find({ anulada: false, createdAt: { $gte: inicio, $lte: fin } })
      .populate('usuario', 'nombre email rol')
      .sort({ createdAt: 1 });

    const totalVentas   = ventas.reduce((s, v) => s + (v.total || 0), 0);
    const totalBurritos = ventas.reduce((s, v) => s + (v.cantidad || 0), 0);

    const NOMBRES_MESES = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const etiquetaMes = `${NOMBRES_MESES[inicio.getMonth()]} ${inicio.getFullYear()}`;
    const nombreArchivo = `reporte_ventas_${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}.pdf`;

    const formatearCOP = (n) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

    const formatoFecha = (f) =>
      new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    doc.pipe(res);

    // ── Encabezado ──
    doc.fontSize(20).fillColor('#E85D3D').text('Burrito FlowOS', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#111111').text(`Reporte de Ventas — ${etiquetaMes}`, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666')
      .text(`Generado: ${formatoFecha(new Date())}  |  Ventas no anuladas`, { align: 'center' });
    doc.moveDown();

    // ── Tabla de ventas ──
    const COLUMNAS = [
      { label: '#',       ancho: 26,  align: 'center' },
      { label: 'Fecha',   ancho: 92,  align: 'left'   },
      { label: 'Burrito', ancho: 125, align: 'left'   },
      { label: 'Cant.',   ancho: 34,  align: 'center' },
      { label: 'Combo',   ancho: 46,  align: 'center' },
      { label: 'Total',   ancho: 88,  align: 'right'  },
      { label: 'Cajero',  ancho: 88,  align: 'left'   }
    ];
    const anchoTotal = COLUMNAS.reduce((s, c) => s + c.ancho, 0);
    const startX = 40;

    const dibujarFila = (datos, filaIdx) => {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
        dibujarFila(datos, filaIdx);
        return;
      }
      if (filaIdx % 2 === 0) {
        doc.rect(startX, y, anchoTotal, 18).fill('#F5F0EB');
      }
      doc.fillColor('#111111').fontSize(9);
      let x = startX;
      datos.forEach((txt, i) => {
        const col = COLUMNAS[i];
        doc.text(String(txt), x + 4, y + 5, { width: col.ancho - 8, align: col.align });
        x += col.ancho;
      });
      doc.moveTo(startX, y + 18).lineTo(startX + anchoTotal, y + 18).strokeColor('#DDDDDD').stroke();
      doc.y = y + 18;
    };

    // Cabecera de tabla
    const yHeader = doc.y;
    doc.rect(startX, yHeader, anchoTotal, 20).fill('#E85D3D');
    doc.fillColor('#FFFFFF').fontSize(10);
    let xH = startX;
    COLUMNAS.forEach((c) => {
      doc.text(c.label, xH + 4, yHeader + 6, { width: c.ancho - 8, align: c.align });
      xH += c.ancho;
    });
    doc.y = yHeader + 20;

    if (ventas.length === 0) {
      doc.fillColor('#999999').fontSize(11).text('No hay ventas registradas en este período.', { align: 'center' });
    } else {
      ventas.forEach((v, i) => {
        dibujarFila([
          i + 1,
          formatoFecha(v.createdAt),
          v.tipo_burrito,
          v.cantidad,
          v.es_combo ? 'Sí' : 'No',
          formatearCOP(v.total),
          (v.usuario && v.usuario.nombre) || '—'
        ], i);
      });
    }

    // ── Resumen ──
    doc.moveDown();
    doc.rect(startX, doc.y, anchoTotal, 26).fill('#C9E4CA');
    doc.fillColor('#111111').fontSize(11);
    doc.text(
      `Ventas del periodo: ${ventas.length}   |   Burritos vendidos: ${totalBurritos}   |   Ingreso total: ${formatearCOP(totalVentas)}`,
      startX + 10, doc.y + 8, { width: anchoTotal - 20, align: 'left' }
    );

    doc.end();
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

// models/Venta.js
const mongoose = require('mongoose');

const DetalleInsumoSchema = new mongoose.Schema({
  insumo:   { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad:   { type: String, required: true }
}, { _id: false });

const VentaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Usuario',
    required: true
  },
  receta: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Receta'
  },
  tipo_burrito: {
    type:     String,
    required: [true, 'El tipo de burrito es obligatorio'],
    trim:     true
  },
  es_combo: {
    type:    Boolean,
    default: false
  },
  cantidad: {
    type:     Number,
    required: [true, 'La cantidad es obligatoria'],
    min:      [1, 'La cantidad mínima es 1']
  },
  precio_unitario: {
    type:     Number,
    required: true,
    min:      0
  },
  total: {
    type:     Number,
    required: true,
    min:      0
  },
  insumos_descontados: [DetalleInsumoSchema],
  anulada: {
    type:    Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Venta', VentaSchema);

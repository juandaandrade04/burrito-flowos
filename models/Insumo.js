// models/Insumo.js
const mongoose = require('mongoose');

const InsumoSchema = new mongoose.Schema({
  nombre: {
    type:     String,
    required: [true, 'El nombre del insumo es obligatorio'],
    trim:     true,
    maxlength: [100, 'El nombre no puede superar 100 caracteres']
  },
  cantidad_actual: {
    type:    Number,
    required: [true, 'La cantidad actual es obligatoria'],
    min:     [0, 'La cantidad no puede ser negativa'],
    default: 0
  },
  unidad_medida: {
    type:     String,
    required: [true, 'La unidad de medida es obligatoria'],
    enum: {
      values:  ['gr', 'kg', 'un', 'lt', 'ml'],
      message: 'Unidad inválida. Use: gr, kg, un, lt, ml'
    }
  },
  stock_minimo: {
    type:    Number,
    default: 0,
    min:     [0, 'El stock mínimo no puede ser negativo']
  },
  activo: {
    type:    Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// ── Virtual: alerta de stock bajo ─────────────
InsumoSchema.virtual('alerta_stock').get(function () {
  return this.cantidad_actual <= this.stock_minimo;
});

InsumoSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Insumo', InsumoSchema);

// models/Receta.js
const mongoose = require('mongoose');

const IngredienteSchema = new mongoose.Schema({
  insumo: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Insumo',
    required: true
  },
  cantidad: {
    type:     Number,
    required: [true, 'La cantidad del ingrediente es obligatoria'],
    min:      [0.01, 'La cantidad debe ser mayor a 0']
  },
  unidad: {
    type:    String,
    required: true,
    enum:    ['gr', 'kg', 'un', 'lt', 'ml']
  }
}, { _id: false });

const RecetaSchema = new mongoose.Schema({
  nombre: {
    type:     String,
    required: [true, 'El nombre de la receta es obligatorio'],
    trim:     true,
    unique:   true
  },
  precio: {
    type:     Number,
    required: [true, 'El precio es obligatorio'],
    min:      [0, 'El precio no puede ser negativo']
  },
  descripcion: {
    type:    String,
    trim:    true,
    maxlength: [300, 'La descripción no puede superar 300 caracteres']
  },
  ingredientes: {
    type:     [IngredienteSchema],
    validate: {
      validator: v => Array.isArray(v) && v.length > 0,
      message:   'La receta debe tener al menos un ingrediente'
    }
  },
  activo: {
    type:    Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Receta', RecetaSchema);

// models/Usuario.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type:     String,
    required: [true, 'El nombre es obligatorio'],
    trim:     true,
    maxlength: [100, 'El nombre no puede superar 100 caracteres']
  },
  email: {
    type:     String,
    required: [true, 'El email es obligatorio'],
    unique:   true,
    lowercase: true,
    trim:     true,
    match:    [/^\S+@\S+\.\S+$/, 'Formato de email inválido']
  },
  password_hash: {
    type:     String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select:   false          // no se retorna por defecto en consultas
  },
  rol: {
    type:    String,
    enum:    { values: ['administrador', 'cajero'], message: 'Rol inválido' },
    default: 'cajero'
  },
  activo: {
    type:    Boolean,
    default: true
  }
}, {
  timestamps: true,          // createdAt / updatedAt automáticos
  versionKey: false
});

// ── Método de instancia: comparar contraseña ──
UsuarioSchema.methods.compararPassword = async function (passwordPlana) {
  return await bcrypt.compare(passwordPlana, this.password_hash);
};

// ── Ocultar password_hash en respuestas JSON ──
UsuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('Usuario', UsuarioSchema);

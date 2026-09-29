const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true, select: false },
  rol: { type: String, enum: ['administrador', 'cajero'], default: 'cajero' },
  activo: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

UsuarioSchema.methods.compararPassword = async function (passwordPlana) {
  return bcrypt.compare(passwordPlana, this.password_hash);
};

UsuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('Usuario', UsuarioSchema);
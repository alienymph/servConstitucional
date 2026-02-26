const mongoose = require('mongoose');

const vinculacionSchema = new mongoose.Schema({
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true,
    index: true
  },

  folio: {
    type: String,
    required: true,
    trim: true
  },

  tipo: {
    type: String,
    trim: true
  },

  vigenciaInicio: {
    type: Date
  },

  vigenciaFin: {
    type: Date
  },

  comentarios: {
    type: String,
    trim: true
  },

  fecha: {
    type: Date,
    default: Date.now
  },

// 🔹 METADATOS
titular: { type: String, trim: true },
cargo: { type: String, trim: true },
correo: { type: String, trim: true, lowercase: true },

cuentaINE: {
  type: Boolean,
  default: false
}, pdf: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FileMeta',
  default: null
},




}, {
  timestamps: true
});

// 🔹 Evita duplicados de folio por empresa
vinculacionSchema.index({ empresa: 1, folio: 1 }, { unique: true });

module.exports = mongoose.model('Vinculacion', vinculacionSchema);

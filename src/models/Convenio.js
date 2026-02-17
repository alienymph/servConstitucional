const mongoose = require('mongoose');

const convenioSchema = new mongoose.Schema({
  folio: {
    type: Number,
    required: true,
    unique: true
  },
  unidadReceptora: {
    type: String,
    required: true
  },
  nombreConvenio: {
    type: String,
    required: true
  },
  fechaInicio: {
    type: Date
  },
  fechaFin: {
    type: Date
  },
  estatus: {
    type: String,
    enum: ['En captura', 'Activo', 'Por vencer', 'Vencido'],
    default: 'En captura'
  },
  pdfs: [{
    type: String
  }],
  metadatos: {
    type: Object
  }
}, { timestamps: true });

module.exports = mongoose.model('Convenio', convenioSchema);

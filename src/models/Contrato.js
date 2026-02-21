const mongoose = require('mongoose');

const contratoSchema = new mongoose.Schema({
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true
  },

  folio: String,
  tipo: String,

  titular: String,
  cargo: String,
  correo: String,
  apoderadoLegal: String,
  enlaceExpediente: [String],

  anio: Number,
  firma: String,
  nacionalidad: String,
  codigo: String,
  rfc: String,

  cuentaINE: {
    type: Boolean,
    default: false
  },

  vigenciaInicio: Date,
  vigenciaFin: Date,

  comentarios: String

}, { timestamps: true });

module.exports = mongoose.model('Contrato', contratoSchema);

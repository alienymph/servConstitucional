// src/models/FileMeta.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileMetaSchema = new Schema({
  titular: String,
  cargo: String,
  correo: String,
  apoderado: String,
  expediente: String,
  vigenciaInicio: { type: Date },
vigenciaFin: { type: Date },
  anio: String,
  firma: String,
  nacionalidad: String,
  codigo: String,
  rfc: String,
  ine: String,
  filename: String,
  contentType: String,
  gridFsId: { type: Schema.Types.ObjectId, required: true },
  content: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FileMeta', FileMetaSchema);

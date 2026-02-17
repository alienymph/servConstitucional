const mongoose = require('mongoose');

const vinculacionSchema = new mongoose.Schema({
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
  folio: { type: String, required: true },
 // <-- cambio de Number a String
  pdfId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileMeta', required: true },
  tipo: { type: String },
  vigencia: { type: Date },
  fecha: { type: Date, default: Date.now },
  comentarios: { type: String }
});

module.exports = mongoose.model('Vinculacion', vinculacionSchema);

const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
 titular: { type: String, trim: true },
cargo: { type: String, trim: true },
correo: { type: String, trim: true, lowercase: true },
rfc: { type: String, trim: true, uppercase: true },
nacionalidad: {
  type: String,
  enum: ['NACIONAL', 'INTERNACIONAL'],
  required: true
}
}, { timestamps: true });// timestamps crea createdAt y updatedAt automáticamente

module.exports = mongoose.model('Empresa', empresaSchema);

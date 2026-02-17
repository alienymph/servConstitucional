const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true }); // timestamps crea createdAt y updatedAt automáticamente

module.exports = mongoose.model('Empresa', empresaSchema);

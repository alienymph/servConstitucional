const mongoose = require('mongoose');
const { Schema } = mongoose;

const ConvenioSchema = new Schema({
  nombreUR: {        
    type: String,
    required: true,
    unique: true
  },
  numeroConvenio: {  
    type: Number,
    required: true,
    unique: true
  },
  anio: {             
    type: Number,
    required: true
  },
  consecutivo: {      
    type: Number,
    required: true
  },
  fechaCreacion: {    
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Convenio', ConvenioSchema);

// src/models/FileMeta.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileMetaSchema = new Schema({

  filename: { type: String },
  originalname: { type: String },
  path: { type: String },
  contentType: { type: String },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('FileMeta', FileMetaSchema);

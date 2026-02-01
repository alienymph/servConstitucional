// src/config/db.js
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfsBucket = null;

async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI no definido');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  gfsBucket = new GridFSBucket(db, { bucketName: 'pdfs' });
  console.log('Conectado a MongoDB y GridFS inicializado');
}

function getBucket() {
  if (!gfsBucket) throw new Error('GridFSBucket no inicializado. Llama a connectDB primero.');
  return gfsBucket;
}

module.exports = { connectDB, getBucket };

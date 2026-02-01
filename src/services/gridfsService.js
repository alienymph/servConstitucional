// src/services/gridfsService.js
const { getBucket } = require('../config/db');
const { ObjectId } = require('mongodb');

async function uploadBufferToGridFS(buffer, filename, contentType, metadata = {}) {
  const bucket = getBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { contentType, metadata });
    uploadStream.on('error', (err) => {
      console.error('[gridfs] uploadStream error', err);
      reject(err);
    });
    uploadStream.on('finish', (file) => {
      console.log('[gridfs] uploadStream finish', file._id.toString());
      resolve(file);
    });
    uploadStream.end(buffer);
  });
}

function downloadStreamById(id) {
  const bucket = getBucket();
  return bucket.openDownloadStream(new ObjectId(id));
}

async function deleteById(id) {
  const bucket = getBucket();
  return bucket.delete(new ObjectId(id));
}

module.exports = { uploadBufferToGridFS, downloadStreamById, deleteById };

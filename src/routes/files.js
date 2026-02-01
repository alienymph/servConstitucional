// src/routes/files.js
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const router = express.Router();
const FileMeta = require('../models/FileMeta');

// IMPORT seguro del servicio GridFS
let gridfsService;
try {
  gridfsService = require('../services/gridfsService');
  // Comprueba que exporte lo necesario
  if (!gridfsService || typeof gridfsService.uploadBufferToGridFS !== 'function' || typeof gridfsService.downloadStreamById !== 'function') {
    console.warn('[files.js] gridfsService exports:', Object.keys(gridfsService || {}));
    throw new Error('gridfsService no exporta las funciones esperadas (uploadBufferToGridFS, downloadStreamById)');
  }
} catch (err) {
  console.error('[files.js] Error cargando services/gridfsService:', err && err.stack ? err.stack : err);
  // Re-lanzar para que el proceso muestre el error y no continúe con rutas incompletas
  throw err;
}

const { uploadBufferToGridFS, downloadStreamById, deleteById } = gridfsService;

// Multer en memoria
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/files/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('[upload] request received');
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibió archivo' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ ok: false, error: 'Solo PDFs permitidos' });

    const fileDoc = await uploadBufferToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype, { uploadedBy: 'web' });

    const metaDoc = new FileMeta({
      empresa: req.file.originalname || 'Sin nombre',
      titular: 'Sin titular',
      correo: 'unknown@example.com',
      filename: fileDoc.filename,
      contentType: req.file.mimetype,
      gridFsId: fileDoc._id
    });
    await metaDoc.save();

    return res.status(201).json({ ok: true, message: 'Archivo subido correctamente', meta: { _id: metaDoc._id } });
  } catch (err) {
    console.error('[upload] error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: 'Error subiendo archivo', details: err.message || String(err) });
  }
});

// GET /api/files (list) - ya deberías tenerlo; mantenlo si existe
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const sortBy = req.query.sortBy || 'createdAt'; // campo por defecto
    const order = req.query.order === 'asc' ? 1 : -1; // ascendente o descendente

    const filter = {};
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { titular: re }, { cargo: re }, { correo: re },
        { apoderado: re }, { expediente: re },
        { nacionalidad: re }, { codigo: re }, { rfc: re },
        { content: re }, { filename: re }
      ];
    }

    const items = await FileMeta.find(filter).sort({ [sortBy]: order }).lean();
    res.json({ ok: true, items });
  } catch (err) {
    console.error('GET /api/files error', err);
    res.status(500).json({ ok: false, error: 'Error listando archivos' });
  }
});


// VIEW y DOWNLOAD (asegúrate de tener estas rutas)
router.get('/view/:id', async (req, res) => {
  try {
    const meta = await FileMeta.findById(req.params.id).lean();
    if (!meta) return res.status(404).send('Archivo no encontrado');
    const gridId = meta.gridFsId ? String(meta.gridFsId) : null;
    if (!gridId) return res.status(404).send('Archivo no encontrado en GridFS');
    return res.render('view', { filename: meta.filename, gridId });
  } catch (err) {
    console.error('GET /api/files/view error', err);
    return res.status(500).send('Error mostrando el archivo');
  }
});

const { ObjectId } = require('mongodb');
router.get('/download/:gridId', async (req, res) => {
  try {
    const gridId = req.params.gridId;
    if (!ObjectId.isValid(gridId)) return res.status(400).send('ID inválido');
    const stream = downloadStreamById(gridId);
    stream.on('error', (err) => {
      console.error('[download] GridFS stream error', err);
      if (!res.headersSent) return res.status(404).send('Archivo no encontrado');
      try { res.destroy(); } catch (e) {}
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    stream.pipe(res);
  } catch (err) {
    console.error('[download] unexpected error', err);
    if (!res.headersSent) res.status(500).send('Error descargando archivo');
  }
});




router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    const meta = await FileMeta.findById(id);
    if (!meta) {
      return res.status(404).json({ ok: false, error: 'Metadato no encontrado' });
    }

    // Eliminar archivo en GridFS si existe
    if (meta.gridFsId && ObjectId.isValid(meta.gridFsId)) {
      try {
        await deleteById(meta.gridFsId);
        console.log('[delete] GridFS eliminado', meta.gridFsId.toString());
      } catch (err) {
        console.warn('[delete] No se pudo eliminar en GridFS:', err.message);
        // No abortamos, seguimos con metadato
      }
    }

    // Eliminar metadato
    await meta.deleteOne();
    console.log('[delete] Metadato eliminado', id);

    return res.json({ ok: true, message: 'Archivo y metadato eliminados' });
  } catch (err) {
    console.error('[delete] error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: 'Error eliminando archivo', details: err.message });
  }
});

const pdfParse = require('pdf-parse');

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibió archivo' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ ok: false, error: 'Solo PDFs permitidos' });

    // Guardar en GridFS
    const fileDoc = await uploadBufferToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);

    // Extraer texto del PDF
    let contentText = '';
    try {
      const data = await pdfParse(req.file.buffer);
      contentText = data.text;
    } catch (err) {
      console.warn('[upload] no se pudo extraer texto:', err.message);
    }

    // Guardar metadato con contenido
    const metaDoc = new FileMeta({
      empresa: req.file.originalname,
      filename: fileDoc.filename,
      contentType: req.file.mimetype,
      gridFsId: fileDoc._id,
      content: contentText
    });
    await metaDoc.save();

    res.status(201).json({ ok: true, message: 'Archivo subido e indexado', meta: { _id: metaDoc._id } });
  } catch (err) {
    console.error('[upload] error:', err);
    res.status(500).json({ ok: false, error: 'Error subiendo archivo' });
  }
});

const PDFDocument = require('pdfkit');

// POST /api/files/create
/* ===========================
   CREAR NUEVO PDF
=========================== */
router.post('/create', async (req, res) => {
  try {
    const {
      titular, cargo, correo, apoderado, expediente,
      vigenciaInicio, vigenciaFin, anio, firma,
      nacionalidad, codigo, rfc, ine
    } = req.body;

    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      const fileDoc = await uploadBufferToGridFS(buffer, 'nuevo.pdf', 'application/pdf');

      const metaDoc = new FileMeta({
        titular, cargo, correo, apoderado, expediente,
        vigenciaInicio, vigenciaFin, anio, firma,
        nacionalidad, codigo, rfc, ine,
        filename: 'nuevo.pdf',
        contentType: 'application/pdf',
        gridFsId: fileDoc._id,
        content: `
Titular: ${titular}
Cargo: ${cargo}
Correo: ${correo}
Apoderado legal: ${apoderado}
Enlace expediente: ${expediente}
Vigencia: ${vigenciaInicio} - ${vigenciaFin}
Año: ${anio}
Firma: ${firma}
Nacionalidad: ${nacionalidad}
Código: ${codigo}
RFC: ${rfc}
Cuenta con INE: ${ine}
        `
      });
      await metaDoc.save();
      res.redirect('/manage');
    });

    doc.fontSize(16).text(`Titular: ${titular}`);
    doc.text(`Cargo: ${cargo}`);
    doc.text(`Correo: ${correo}`);
    doc.text(`Apoderado legal: ${apoderado}`);
    doc.text(`Enlace expediente: ${expediente}`);
    doc.text(`Vigencia: ${vigenciaInicio} - ${vigenciaFin}`);
    doc.text(`Año: ${anio}`);
    doc.text(`Firma: ${firma}`);
    doc.text(`Nacionalidad: ${nacionalidad}`);
    doc.text(`Código: ${codigo}`);
    doc.text(`RFC: ${rfc}`);
    doc.text(`Cuenta con INE: ${ine}`);
    doc.end();
  } catch (err) {
    console.error('[create] error:', err);
    res.status(500).send('Error creando PDF');
  }
});

// GET /api/files/edit/:id → carga formulario con datos
// GET /api/files/edit/:id
router.get('/edit/:id', async (req, res) => {
  try {
    const meta = await FileMeta.findById(req.params.id).lean();
    if (!meta) return res.status(404).send('Archivo no encontrado');
    res.render('edit', { meta });
  } catch (err) {
    console.error('[edit GET] error:', err);
    res.status(500).send('Error cargando formulario');
  }
});

// POST /api/files/edit/:id → guarda cambios y regenera PDF
router.post('/edit/:id', async (req, res) => {
  try {
    const meta = await FileMeta.findById(req.params.id);
    if (!meta) return res.status(404).send('Archivo no encontrado');

    // Actualiza todos los campos desde el formulario
    const {
      titular,
      cargo,
      correo,
      apoderado,
      expediente,
      vigenciaInicio,
      vigenciaFin,
      anio,
      firma,
      nacionalidad,
      codigo,
      rfc,
      ine
    } = req.body;

    Object.assign(meta, {
      titular,
      cargo,
      correo,
      apoderado,
      expediente,
      vigenciaInicio,
      vigenciaFin,
      anio,
      firma,
      nacionalidad,
      codigo,
      rfc,
      ine
    });

    // Genera un nuevo PDF con los valores actualizados
    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      // Opcional: elimina el PDF anterior de GridFS para no acumular
      // if (meta.gridFsId) { try { await deleteById(meta.gridFsId); } catch (e) { console.warn('[edit] no se pudo eliminar PDF previo:', e.message); } }

      // Sube el nuevo PDF a GridFS
      const fileDoc = await uploadBufferToGridFS(buffer, 'editado.pdf', 'application/pdf');
      meta.filename = 'editado.pdf';
      meta.gridFsId = fileDoc._id;

      // Actualiza el contenido indexable para búsquedas
      meta.content = [
        `Titular: ${meta.titular}`,
        `Cargo: ${meta.cargo}`,
        `Correo: ${meta.correo}`,
        `Apoderado legal: ${meta.apoderado}`,
        `Enlace expediente: ${meta.expediente}`,
        `Vigencia: ${meta.vigenciaInicio} - ${meta.vigenciaFin}`,
        `Año: ${meta.anio}`,
        `Firma: ${meta.firma}`,
        `Nacionalidad: ${meta.nacionalidad}`,
        `Código: ${meta.codigo}`,
        `RFC: ${meta.rfc}`,
        `Cuenta con INE: ${meta.ine}`
      ].join('\n');

      await meta.save();
      return res.redirect('/manage');
    });

    // Escribe todos los campos en el PDF (formato simple, una línea por campo)
    doc.fontSize(16).text(`Titular: ${titular}`);
    doc.text(`Cargo: ${cargo}`);
    doc.text(`Correo: ${correo}`);
    doc.text(`Apoderado legal: ${apoderado}`);
    doc.text(`Enlace expediente: ${expediente}`);
    doc.text(`Vigencia: ${vigenciaInicio} - ${vigenciaFin}`);
    doc.text(`Año: ${anio}`);
    doc.text(`Firma: ${firma}`);
    doc.text(`Nacionalidad: ${nacionalidad}`);
    doc.text(`Código: ${codigo}`);
    doc.text(`RFC: ${rfc}`);
    doc.text(`Cuenta con INE: ${ine}`);

    doc.end();
  } catch (err) {
    console.error('[edit POST] error:', err && err.stack ? err.stack : err);
    return res.status(500).send('Error guardando cambios');
  }
});


module.exports = router;

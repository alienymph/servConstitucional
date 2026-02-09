const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const router = express.Router();
const FileMeta = require('../models/FileMeta');
const { ObjectId } = require('mongodb');
const pdfParse = require('pdf-parse');

// GridFS service
const { uploadBufferToGridFS, downloadStreamById, deleteById } =
  require('../services/gridfsService');

// Multer en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

/* ===========================
   SUBIR PDF + METADATOS
=========================== */
router.post('/upload', upload.single('pdffile'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: 'No se recibió archivo' });

    if (req.file.mimetype !== 'application/pdf')
      return res.status(400).json({ ok: false, error: 'Solo PDFs permitidos' });

    // Subir a GridFS
    const fileDoc = await uploadBufferToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Extraer texto del PDF
    let contentText = '';
    try {
      const data = await pdfParse(req.file.buffer);
      contentText = data.text;
    } catch (_) {}

const metaDoc = new FileMeta({
  ...req.body,
  vigenciaInicio: req.body.vigenciaInicio
    ? new Date(req.body.vigenciaInicio)
    : null,
  vigenciaFin: req.body.vigenciaFin
    ? new Date(req.body.vigenciaFin)
    : null,

  filename: req.file.originalname,
  contentType: req.file.mimetype,
  gridFsId: fileDoc._id,
  content: contentText
});


    await metaDoc.save();

    res.redirect('/manage');
  } catch (err) {
    console.error('[UPLOAD]', err);
    res.status(500).json({ ok: false, error: 'Error subiendo PDF' });
  }
});

/* ===========================
   LISTAR PDFS
=========================== */
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const filter = {};
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [
        { titular: re },
        { cargo: re },
        { correo: re },
        { expediente: re },
        { rfc: re },
        { filename: re },
        { content: re }
      ];
    }

const items = await FileMeta.find(filter)
  .sort({ [sortBy]: order })
  .lean();

const today = new Date();

const itemsWithExpiry = items.map(file => {
  let diffDays = null;

  if (file.vigenciaFin) {
    diffDays = Math.ceil(
      (new Date(file.vigenciaFin) - today) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    ...file,
    diffDays
  };
});

res.json({ ok: true, items: itemsWithExpiry });

  } catch (err) {
    console.error('[LIST]', err);
    res.status(500).json({ ok: false, error: 'Error listando archivos' });
  }
});

/* ===========================
   VER PDF
=========================== */
router.get('/download/:gridId', async (req, res) => {
  try {
    const { gridId } = req.params;
    if (!ObjectId.isValid(gridId))
      return res.status(400).send('ID inválido');

    const stream = downloadStreamById(gridId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    stream.pipe(res);
  } catch (err) {
    console.error('[DOWNLOAD]', err);
    res.status(404).send('Archivo no encontrado');
  }
});

/* ===========================
   ELIMINAR
=========================== */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ ok: false });

    const meta = await FileMeta.findById(id);
    if (!meta) return res.status(404).json({ ok: false });

    if (meta.gridFsId) {
      await deleteById(new ObjectId(meta.gridFsId));
    }

    await meta.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE]', err);
    res.status(500).json({ ok: false });
  }
});

/* ===========================
   VER PDF (VISTA)
=========================== */
router.get('/view/:id', async (req, res) => {
  try {
    const file = await FileMeta.findById(req.params.id).lean();

    if (!file) {
      return res.status(404).send('Archivo no encontrado');
    }

    res.render('view', {
      file
    });
  } catch (err) {
    console.error('[VIEW ERROR]', err);
    res.status(500).send('Error al mostrar PDF');
  }
});


/* ===========================
   EDITAR PDF (VISTA)
=========================== */
/* ===========================
   EDITAR PDF (VISTA)
=========================== */
router.get('/edit/:id', async (req, res) => {
  try {
    const meta = await FileMeta.findById(req.params.id).lean();
    if (!meta) return res.status(404).send('Archivo no encontrado');

    res.render('edit', { meta });
  } catch (err) {
    console.error('[EDIT]', err);
    res.status(500).send('Error al cargar edición');
  }
});


/* ===========================
   GUARDAR CAMBIOS
=========================== */
router.post('/edit/:id', async (req, res) => {
  try {
    const data = {
      ...req.body,
      vigenciaInicio: req.body.vigenciaInicio
        ? new Date(req.body.vigenciaInicio)
        : null,
      vigenciaFin: req.body.vigenciaFin
        ? new Date(req.body.vigenciaFin)
        : null
    };

    await FileMeta.findByIdAndUpdate(req.params.id, data);
    res.redirect('/manage');
  } catch (err) {
    console.error('[UPDATE]', err);
    res.status(500).send('Error al guardar cambios');
  }
});





module.exports = router;

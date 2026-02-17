const express = require('express');
const router = express.Router();
const Vinculacion = require('../models/Vinculacion');
const Empresa = require('../models/Empresa');
const FileMeta = require('../models/FileMeta');

// ─── Formulario nuevo contrato para empresa específica
router.get('/nuevo/:empresaId', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.empresaId).lean();
    if (!empresa) return res.status(404).send('Empresa no encontrada');

    const archivos = await FileMeta.find().lean();

    res.render('nuevoContrato', { empresa, archivos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar formulario de contrato');
  }
});

// ─── Guardar contrato
router.post('/nuevo/:empresaId', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.empresaId);
    if (!empresa) return res.status(404).send('Empresa no encontrada');

    const { pdfId, tipo, vigencia, comentarios } = req.body;

    // Folio: XXX-2026-001
    const count = await Vinculacion.countDocuments({ empresa: empresa._id });
    const numeroConsecutivo = String(count + 1).padStart(3, '0');
    const año = new Date().getFullYear();
    const folio = `${empresa.nombre.slice(0,3).toUpperCase()}-${año}-${numeroConsecutivo}`;

    const nuevoContrato = new Vinculacion({
      empresa: empresa._id,
      pdfId,
      tipo,
      vigencia,
      comentarios,
      folio
    });

    await nuevoContrato.save();

    res.redirect(`/vinculaciones/empresa/${empresa._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar el contrato');
  }
});

module.exports = router;

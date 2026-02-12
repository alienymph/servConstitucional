const express = require('express');
const router = express.Router();
const Convenio = require('../models/Convenio');


// GET /api/convenios?q=
router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    const items = await Convenio.find({
      nombreUR: { $regex: q, $options: 'i' }
    }).sort({ numeroConvenio: 1 }).lean();

    res.json({ ok: true, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

// DELETE /api/convenios/:id
router.delete('/:id', async (req, res) => {
  try {
    await Convenio.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;


// --------------------
// GET: Formulario de alta
// --------------------
router.get('/nueva', (req, res) => {
  res.render('altaConvenio'); // Asegúrate de tener views/altaConvenio.ejs
});

// --------------------
// POST: Crear nuevo convenio
// --------------------
router.post('/alta', async (req, res) => {
  try {
    const { nombreUR } = req.body;

    // Revisar si ya existe la UR
    const existente = await Convenio.findOne({ nombreUR });
    if (existente) {
      return res.status(400).json({ ok: false, message: 'La unidad receptora ya existe' });
    }

    // Consecutivo automático
    const last = await Convenio.findOne().sort({ numeroConvenio: -1 });
    const numeroConvenio = last ? last.numeroConvenio + 1 : 1;

    const nuevoConvenio = new Convenio({
      nombreUR,
      numeroConvenio,
      anio: new Date().getFullYear(),
      consecutivo: numeroConvenio
    });

    await nuevoConvenio.save();
    res.json({ ok: true, convenio: nuevoConvenio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al registrar convenio' });
  }
});

// --------------------
// GET: Listar todos los convenios (para Manage)
// --------------------
router.get('/', async (req, res) => {
  try {
    const convenios = await Convenio.find().sort({ numeroConvenio: 1 });
    res.json(convenios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener convenios' });
  }
});

module.exports = router;

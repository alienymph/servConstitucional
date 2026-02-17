const express = require('express');
const router = express.Router();
const Convenio = require('../models/Convenio');


// 🆕 Vista alta (ya no necesita empresas)
router.get('/nuevo', (req, res) => {
  res.render('nuevoConvenio');
});


// 🆕 Crear convenio (flujo nuevo simplificado)
router.post('/', async (req, res) => {
  try {
    const { empresaNombre } = req.body;

    if (!empresaNombre) {
      return res.status(400).send('La unidad receptora es obligatoria');
    }

    const year = new Date().getFullYear();

    // Buscar el último convenio del año actual
    const ultimo = await Convenio.findOne({
      nombreConvenio: new RegExp(`UR-${year}`)
    }).sort({ createdAt: -1 });

    let consecutivo = 1;

    if (ultimo) {
      const partes = ultimo.nombreConvenio.split('-');
      consecutivo = parseInt(partes[2]) + 1;
    }

    const nombreConvenio = `UR-${year}-${String(consecutivo).padStart(4, '0')}`;

    const nuevoConvenio = await Convenio.create({
      unidadReceptora: empresaNombre,
      folio: consecutivo, // interno numérico
      nombreConvenio
    });

    res.redirect('/manage');


  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


// RUTA /manage
router.get('/manage', async (req, res) => {
  try {
    // Busca todos los convenios en la base de datos y ordénalos por fecha
    const convenios = await Convenio.find().sort({ createdAt: -1 }).lean();

    // Renderiza la vista manage.ejs y le pasa los convenios
    res.render('manage', { convenios });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar convenios');
  }
});


// 🔎 Ver detalle de convenio
router.get('/:id', async (req, res) => {
  try {
    const convenio = await Convenio.findById(req.params.id);

    if (!convenio) {
      return res.status(404).send('Convenio no encontrado');
    }

    res.render('detalleConvenio', { convenio });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error al buscar convenio');
  }
});


module.exports = router;

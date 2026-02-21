const express = require('express');
const router = express.Router();
const Vinculacion = require('../models/Vinculacion');
const Empresa = require('../models/Empresa');
const FileMeta = require('../models/FileMeta');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Contrato = require('../models/Contrato');



// ─── Formulario nuevo contrato
router.get('/nuevo/:empresaId', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.empresaId).lean();
    if (!empresa) return res.status(404).send('Empresa no encontrada');

    const archivos = await FileMeta.find({ empresa: empresa._id }).lean();

    res.render('nuevoContrato', { empresa, archivos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar formulario de contrato');
  }
});

// ─── Guardar contrato nuevo
router.post('/nuevo/:empresaId', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.empresaId);
    if (!empresa) return res.status(404).send('Empresa no encontrada');

    const {
  pdf,
  tipo,
  vigenciaInicio,
  vigenciaFin,
  comentarios,
  titular,
  cargo,
  correo,
  apoderadoLegal,
  enlaceExpediente,
  anio,
  firma,
  nacionalidad,
  codigo,
  rfc,
  cuentaINE
} = req.body;


    const count = await Vinculacion.countDocuments({ empresa: empresa._id });
    const numeroConsecutivo = String(count + 1).padStart(3, '0');
    const año = new Date().getFullYear();
    const folio = `${empresa.nombre.slice(0,3).toUpperCase()}-${año}-${numeroConsecutivo}`;

    const nuevoContrato = new Vinculacion({
  empresa: empresa._id,
  pdf,
  tipo,
  vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : null,
  vigenciaFin: vigenciaFin ? new Date(vigenciaFin) : null,
  comentarios,
  folio,

  // 🔥 METADATOS
  titular,
  cargo,
  correo,
  apoderadoLegal,
  enlaceExpediente,
  anio,
  firma,
  nacionalidad,
  codigo,
  rfc,
  cuentaINE: cuentaINE === 'true'
});


    await nuevoContrato.save();

    res.redirect(`/contratos/ver/${nuevoContrato._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar el contrato');
  }
});

// ─── Formulario editar contrato
router.get('/editar/:id', async (req, res) => {
  try {
    const contrato = await Vinculacion.findById(req.params.id)
      .populate('empresa')
      .lean();
    if (!contrato) return res.status(404).send('Contrato no encontrado');

    res.render('editarContrato', { contrato });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar formulario de edición');
  }
});

// ─── Guardar cambios de contrato
router.post('/editar/:id', async (req, res) => {
  try {

    const contrato = await Vinculacion.findById(req.params.id);
    if (!contrato) return res.status(404).send('Contrato no encontrado');

    const {
      tipo,
      vigenciaInicio,
      vigenciaFin,
      comentarios,
      titular,
      cargo,
      correo,
      apoderadoLegal,
      enlaceExpediente,
      anio,
      firma,
      nacionalidad,
      codigo,
      rfc,
      cuentaINE
    } = req.body;

    // Campos básicos
    contrato.tipo = tipo || contrato.tipo;
    contrato.vigenciaInicio = vigenciaInicio ? new Date(vigenciaInicio) : contrato.vigenciaInicio;
    contrato.vigenciaFin = vigenciaFin ? new Date(vigenciaFin) : contrato.vigenciaFin;
    contrato.comentarios = comentarios || contrato.comentarios;

    // Metadatos nuevos
    contrato.titular = titular;
    contrato.cargo = cargo;
    contrato.correo = correo;
    contrato.apoderadoLegal = apoderadoLegal;
    contrato.enlaceExpediente = enlaceExpediente;
    contrato.anio = anio;
    contrato.firma = firma;
    contrato.nacionalidad = nacionalidad;
    contrato.codigo = codigo;
    contrato.rfc = rfc;
    contrato.cuentaINE = cuentaINE === 'true';

    await contrato.save();

    res.redirect(`/contratos/ver/${contrato._id}`);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar cambios del contrato');
  }
});


router.get('/ver/:id', async (req, res) => {
  try {
   const contrato = await Vinculacion.findById(req.params.id)
  .populate('empresa');


    if (!contrato) return res.status(404).send('Contrato no encontrado');

    res.render('verContrato', { contrato });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar contrato');
  }
});



router.post('/subir-pdf/:id', upload.single('pdf'), async (req, res) => {
  try {
    const contrato = await Vinculacion.findById(req.params.id);
    if (!contrato) return res.status(404).send('Contrato no encontrado');

    if (!req.file) return res.status(400).send('No se subió archivo');

    // Guardar metadata básica del archivo
    const nuevoFile = await FileMeta.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path
    });

    contrato.pdf = nuevoFile._id;
    await contrato.save();

    res.redirect(`/contratos/ver/${contrato._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al subir PDF');
  }
});

router.post('/eliminar-pdf/:id', async (req, res) => {
  try {
    const contrato = await Vinculacion.findById(req.params.id);
    if (!contrato) return res.status(404).send('Contrato no encontrado');

    contrato.pdf = null;
    await contrato.save();

    res.redirect(`/contratos/ver/${contrato._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar PDF');
  }
});


module.exports = router;

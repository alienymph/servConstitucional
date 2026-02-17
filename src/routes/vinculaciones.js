const express = require('express');
const router = express.Router();
const Vinculacion = require('../models/Vinculacion');
const Empresa = require('../models/Empresa');
const FileMeta = require('../models/FileMeta');

// ─── Formulario de nueva vinculación ─────────
router.get('/nuevo', async (req, res) => {
  try {
    const empresas = await Empresa.find().lean(); // Lista de empresas
    const archivos = await FileMeta.find().lean(); // Lista de PDFs

    res.render('nuevoVinculacion', { empresas, archivos });
  } catch (err) {
    console.error('Error al cargar formulario:', err);
    res.status(500).send('Error al cargar el formulario de vinculación');
  }
});

// ─── Guardar vinculación ─────────────────────
router.post('/nuevo', async (req, res) => {
  try {
    const { empresaNombre, pdfId, tipo, vigencia, comentarios } = req.body;

    // Crear empresa si no existe
    let empresa = await Empresa.findOne({ nombre: empresaNombre });
    if (!empresa) {
      empresa = new Empresa({ nombre: empresaNombre });
      await empresa.save();
    }

// Calcular número consecutivo por empresa
const count = await Vinculacion.countDocuments({ empresa: empresa._id });
const numeroConsecutivo = String(count + 1).padStart(3, '0'); // 001, 002, 003

// Año actual
const año = new Date().getFullYear();

// Folio por empresa: XXX-AÑO-NumeroConsecutivo (3 primeras letras)
const folioEmpresa = `${empresa.nombre.slice(0,3).toUpperCase()}-${año}-${numeroConsecutivo}`;


    // Crear vinculación
    const vinculacion = new Vinculacion({
      empresa: empresa._id,
      folio: folioEmpresa,
      pdfId,
      tipo,
      vigencia,
      comentarios
    });

    await vinculacion.save();

    res.redirect(`/vinculaciones/empresa/${empresa._id}`);
  } catch (err) {
    console.error('Error al guardar vinculación:', err);
    res.status(500).send('Error al guardar la vinculación');
  }
});

// ─── Listado de todas las empresas/UR vinculadas ─────────
router.get('/empresas', async (req, res) => {
  try {
    const { orden } = req.query; // 'alfabetico' o 'reciente'

    let sortOption = {};
    if (orden === 'alfabetico') {
      sortOption = { nombre: 1 }; // Ascendente
    } else if (orden === 'reciente') {
      sortOption = { createdAt: -1 }; // Más reciente primero
    }

    const empresas = await Empresa.find().sort(sortOption).lean();
    res.render('manageVinculacion', { empresas, orden });
  } catch (err) {
    console.error('Error al cargar empresas:', err);
    res.status(500).send('Error al cargar las empresas');
  }
});


// ─── Vista de una empresa con sus vinculaciones ─────────
router.get('/empresa/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id).lean();
    if (!empresa) return res.status(404).send('Empresa no encontrada');

    const vinculaciones = await Vinculacion.find({ empresa: empresa._id })
      .populate('pdfId')
      .lean();

    // Contar número de vinculaciones
    const vinculosCount = await Vinculacion.countDocuments({ empresa: empresa._id });

    res.render('empresaVinculacion', { empresa, vinculaciones, vinculosCount });
  } catch (err) {
    console.error('Error al cargar la empresa:', err);
    res.status(500).send('Error al cargar la empresa');
  }
});


// ─── NUEVAS RUTAS DE EDITAR Y ELIMINAR ─────────
// ─── Formulario para editar una vinculación ─────────
router.get('/editar/:id', async (req, res) => {
  try {
    const vinculacion = await Vinculacion.findById(req.params.id)
      .populate('empresa')
      .populate('pdfId')
      .lean();
    if (!vinculacion) return res.status(404).send('Vinculación no encontrada');

    const empresas = await Empresa.find().lean(); // Para seleccionar otra empresa si se quiere
    const archivos = await FileMeta.find().lean(); // Para cambiar PDF

    res.render('editarVinculacion', { vinculacion, empresas, archivos });
  } catch (err) {
    console.error('Error al cargar formulario de edición:', err);
    res.status(500).send('Error al cargar el formulario de edición');
  }
});

// ─── Guardar cambios de la vinculación ─────────
router.post('/editar/:id', async (req, res) => {
  try {
    const { empresaNombre, pdfId, tipo, vigencia, comentarios } = req.body;

    let empresa = await Empresa.findOne({ nombre: empresaNombre });
    if (!empresa) {
      empresa = new Empresa({ nombre: empresaNombre });
      await empresa.save();
    }

    router.post('/editar/:id', async (req, res) => {
  try {
    const { tipo, vigencia, comentarios, pdfId } = req.body;

    const vinculacion = await Vinculacion.findByIdAndUpdate(
      req.params.id,
      {
        tipo,
        vigencia,
        comentarios,
        pdfId
      },
      { new: true }
    );

    res.redirect(`/vinculaciones/empresa/${vinculacion.empresa}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar');
  }
});


 //ELIMINAR




    // Actualizar número consecutivo si se cambió de empresa
    const count = await Vinculacion.countDocuments({ empresa: empresa._id });
const numeroConsecutivo = String(count + 1).padStart(3, '0'); // 001, 002, 003
const año = new Date().getFullYear();
const folioEmpresa = `${empresa.nombre.slice(0,3).toUpperCase()}-${año}-${numeroConsecutivo}`;


    await Vinculacion.findByIdAndUpdate(req.params.id, {
      empresa: empresa._id,
      folio: folioEmpresa,
      pdfId,
      tipo,
      vigencia,
      comentarios
    });

    res.redirect(`/vinculaciones/empresa/${empresa._id}`);
  } catch (err) {
    console.error('Error al guardar cambios en la vinculación:', err);
    res.status(500).send('Error al guardar los cambios');
  }
});

// ─── Eliminar una vinculación ─────────
router.post('/eliminar/:id', async (req, res) => {
  try {
    const vinculacion = await Vinculacion.findById(req.params.id);
    if (!vinculacion) return res.status(404).send('Vinculación no encontrada');

    await Vinculacion.findByIdAndDelete(req.params.id);

    res.redirect(`/vinculaciones/empresa/${vinculacion.empresa}`);
  } catch (err) {
    console.error('Error al eliminar vinculación:', err);
    res.status(500).send('Error al eliminar la vinculación');
  }
});
// ─── EDITAR EMPRESA (FORMULARIO) ─────────
router.get('/empresas/:id/editar', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id).lean();
    if (!empresa) return res.status(404).send('Empresa no encontrada');

    res.render('editarEmpresa', { empresa });
  } catch (err) {
    console.error('Error al cargar empresa para editar:', err);
    res.status(500).send('Error al cargar la empresa');
  }
});

// ─── GUARDAR CAMBIOS DE EMPRESA ─────────
router.post('/empresas/:id', async (req, res) => {
  try {
    const { nombre } = req.body;

    await Empresa.findByIdAndUpdate(req.params.id, { nombre });

    res.redirect('/vinculaciones/empresas');
  } catch (err) {
    console.error('Error al actualizar empresa:', err);
    res.status(500).send('Error al actualizar la empresa');
  }
});

// ─── BORRAR EMPRESA COMPLETA ─────────
router.post('/empresas/:id/borrar', async (req, res) => {
  try {
    const empresaId = req.params.id;

    // borrar todas sus vinculaciones
    await Vinculacion.deleteMany({ empresa: empresaId });

    // borrar empresa
    await Empresa.findByIdAndDelete(empresaId);

    res.redirect('/vinculaciones/empresas');
  } catch (err) {
    console.error('Error al borrar empresa:', err);
    res.status(500).send('Error al borrar la empresa');
  }
});



router.get('/editar/:id', async (req, res) => {
  try {
    const vinculacion = await Vinculacion.findById(req.params.id).lean();
    const empresa = await Empresa.findById(vinculacion.empresa).lean();
    const archivos = await FileMeta.find().lean();

    if (!vinculacion) return res.status(404).send('Vinculación no encontrada');

    res.render('editarVinculacion', {
      vinculacion,
      empresa,
      archivos
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar la edición');
  }
});

// ─── ELIMINAR EMPRESA Y TODAS SUS VINCULACIONES ─────────
router.delete('/empresas/:id', async (req, res) => {
  try {
    const empresaId = req.params.id;

    // 1️⃣ borrar vinculaciones de la empresa
    await Vinculacion.deleteMany({ empresa: empresaId });

    // 2️⃣ borrar la empresa
    await Empresa.findByIdAndDelete(empresaId);

    // 3️⃣ regresar al listado
    res.redirect('/vinculaciones/empresas');
  } catch (error) {
    console.error('Error al borrar empresa:', error);
    res.status(500).send('Error al borrar la empresa');
  }
});


module.exports = router;

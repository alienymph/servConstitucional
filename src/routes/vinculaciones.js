const express = require('express');
const router = express.Router();
const Vinculacion = require('../models/Vinculacion');
const Empresa = require('../models/Empresa');



// ─── FORMULARIO NUEVA VINCULACIÓN ─────────
router.get('/nuevo', (req, res) => {
  res.render('nuevoVinculacion');
});


// ─── GUARDAR VINCULACIÓN ─────────
router.post('/nuevo', async (req, res) => {
  try {
    const {
      empresaNombre,
      tipo,
      vigenciaInicio,
      vigenciaFin,
      comentarios
    } = req.body;
    // 🔥 CORRECCIÓN DE TIMEZONE
    const fechaInicio = vigenciaInicio
      ? new Date(vigenciaInicio + 'T12:00:00')
      : null;

    const fechaFin = vigenciaFin
      ? new Date(vigenciaFin + 'T12:00:00')
      : null;

    let empresa = await Empresa.findOne({ nombre: empresaNombre });
    if (!empresa) {
      empresa = await Empresa.create({ nombre: empresaNombre });
    }

    const count = await Vinculacion.countDocuments({ empresa: empresa._id });
    const numero = String(count + 1).padStart(3, '0');
    const anio = new Date().getFullYear();
    const folio = `${empresa.nombre.slice(0,3).toUpperCase()}-${anio}-${numero}`;

await Vinculacion.create({
  empresa: empresa._id,
  folio,
  tipo,
  vigenciaInicio: fechaInicio,
  vigenciaFin: fechaFin,
  comentarios
});


    res.redirect(`/vinculaciones/empresa/${empresa._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear vinculación');
  }
});


router.get('/empresas', async (req, res) => {
  try {
    const search = req.query.search || '';
    const sortQuery = req.query.sort || 'nombre-asc';
    let sortOption;

    switch(sortQuery) {
      case 'nombre-asc':
        sortOption = { nombre: 1 }; break;
      case 'nombre-desc':
        sortOption = { nombre: -1 }; break;
      case 'fecha-asc':
        sortOption = { createdAt: 1 }; break;
      case 'fecha-desc':
        sortOption = { createdAt: -1 }; break;
      default:
        sortOption = { nombre: 1 };
    }

    // 🔹 Agregación con conteo de vinculaciones
    const empresas = await Empresa.aggregate([
      {
        $match: { nombre: { $regex: search, $options: 'i' } }
      },
      {
        $lookup: {
          from: 'vinculacions', // revisa tu colección real
          localField: '_id',
          foreignField: 'empresa',
          as: 'vinculaciones'
        }
      },
      {
        $addFields: { contratosCount: { $size: '$vinculaciones' } }
      },
      {
        $project: { nombre: 1, createdAt: 1, contratosCount: 1 }
      },
      {
        $sort: sortOption
      }
    ]);

    res.render('manageVinculacion', { empresas, search, sort: sortQuery });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar empresas');
  }
});


// ─── VINCULACIONES DE UNA EMPRESA ─────────
router.get('/empresa/:id', async (req, res) => {
  const empresa = await Empresa.findById(req.params.id).lean();
  const vinculaciones = await Vinculacion.find({ empresa: empresa._id }).lean();
  const vinculosCount = vinculaciones.length;

  res.render('empresaVinculacion', {
    empresa,
    vinculaciones,
    vinculosCount
  });
});


// ─── EDITAR VINCULACIÓN (FORM) ─────────
router.get('/editar/:id', async (req, res) => {
  try {
    const vinculacion = await Vinculacion.findById(req.params.id).lean();

    if (!vinculacion) {
      return res.status(404).send('Vinculación no encontrada');
    }

    res.render('editarVinculacion', { vinculacion });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar edición');
  }
});


// ─── VER VINCULACIÓN ─────────
router.get('/ver/:id', async (req, res) => {
  try {
    const vinculacion = await Vinculacion.findById(req.params.id).lean();

    if (!vinculacion) {
      return res.status(404).send('Vinculación no encontrada');
    }

    res.render('verContrato', { vinculacion });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar vinculación');
  }
});






// ─── GUARDAR EDICIÓN VINCULACIÓN ─────────
router.post('/editar/:id', async (req, res) => {
  try {
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

    const fechaInicio = vigenciaInicio
      ? new Date(vigenciaInicio + 'T12:00:00')
      : null;

    const fechaFin = vigenciaFin
      ? new Date(vigenciaFin + 'T12:00:00')
      : null;

    const vinculacion = await Vinculacion.findByIdAndUpdate(
      req.params.id,
      {
        tipo,
        vigenciaInicio: fechaInicio,
        vigenciaFin: fechaFin,
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
        cuentaINE: cuentaINE ? true : false
      },
      { new: true }
    );

    if (!vinculacion) {
      return res.status(404).send('Vinculación no encontrada');
    }

    res.redirect(`/vinculaciones/empresa/${vinculacion.empresa}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al editar vinculación');
  }
});



// ─── ELIMINAR VINCULACIÓN ─────────
router.post('/eliminar/:id', async (req, res) => {
  const vinculacion = await Vinculacion.findById(req.params.id);
  await Vinculacion.findByIdAndDelete(req.params.id);
  res.redirect(`/vinculaciones/empresa/${vinculacion.empresa}`);
});


// ─── EDITAR EMPRESA ─────────
router.get('/empresas/:id/editar', async (req, res) => {
  const empresa = await Empresa.findById(req.params.id).lean();
  res.render('editarEmpresa', { empresa });
});

router.post('/empresas/:id', async (req, res) => {
  await Empresa.findByIdAndUpdate(req.params.id, {
    nombre: req.body.nombre
  });
  res.redirect('/vinculaciones/empresas');
});


// ─── BORRAR EMPRESA Y TODO ─────────
router.post('/empresas/:id/borrar', async (req, res) => {
  await Vinculacion.deleteMany({ empresa: req.params.id });
  await Empresa.findByIdAndDelete(req.params.id);
  res.redirect('/vinculaciones/empresas');
});


router.get('/subir-pdf/:id', async (req, res) => {
  const vinculacion = await Vinculacion.findById(req.params.id).lean();

  if (!vinculacion) {
    return res.status(404).send('Contrato no encontrado');
  }

  res.render('subirContrato', { vinculacion });
});



module.exports = router;

const express = require('express');
const router = express.Router();
const FileMeta = require('../models/FileMeta');

// HOME con estadísticas basadas en PDFs
router.get('/', async (req, res) => {
  try {
    const hoy = new Date();
    const files = await FileMeta.find().lean();

    // Activos
    const activos = files.filter(f =>
      f.vigenciaFin && new Date(f.vigenciaFin) >= hoy
    );

    // Por vencer (30 días)
    const porVencer = activos.filter(f => {
      const dias = (new Date(f.vigenciaFin) - hoy) / (1000 * 60 * 60 * 24);
      return dias <= 30;
    });

    // Este mes (por fecha de inicio)
    const esteMes = files.filter(f => {
      if (!f.vigenciaInicio) return false;
      const fecha = new Date(f.vigenciaInicio);
      return (
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    });

    // Próximos a vencer (sidebar)
    const proximos = porVencer
      .sort((a, b) =>
        new Date(a.vigenciaFin) - new Date(b.vigenciaFin)
      )
      .slice(0, 5);

    res.render('home', {
      totalActivos: activos.length,
      totalPorVencer: porVencer.length,
      totalEsteMes: esteMes.length,
      proximos
    });

  } catch (error) {
    console.error(error);
    res.render('home', {
      totalActivos: 0,
      totalPorVencer: 0,
      totalEsteMes: 0,
      proximos: []
    });
  }
});

module.exports = router;

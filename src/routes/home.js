const express = require('express');
const router = express.Router();
const Convenio = require('../models/Convenio');

// HOME con estadísticas
router.get('/', async (req, res) => {
  try {
    const hoy = new Date();
    const convenios = await Convenio.find();

    const activos = convenios.filter(c =>
      c.vigenciaFin && new Date(c.vigenciaFin) >= hoy
    );

    const porVencer = activos.filter(c => {
      const dias = (new Date(c.vigenciaFin) - hoy) / (1000 * 60 * 60 * 24);
      return dias <= 30;
    });

    const esteMes = convenios.filter(c => {
      if (!c.vigenciaInicio) return false;
      const fecha = new Date(c.vigenciaInicio);
      return (
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    });

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

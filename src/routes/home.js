const express = require('express');
const router = express.Router();
const Vinculacion = require('../models/Vinculacion');

router.get('/', async (req, res) => {
  try {
    const hoy = new Date();

    const contratos = await Vinculacion.find()
      .populate('empresa')
      .lean();

    // 🟢 Activos
    const activos = contratos.filter(c =>
      c.vigenciaFin && new Date(c.vigenciaFin) >= hoy
    );

    // 🟡 Por vencer (30 días)
    const porVencer = activos.filter(c => {
      const dias = (new Date(c.vigenciaFin) - hoy) / (1000 * 60 * 60 * 24);
      return dias <= 7;
    });

    // 🔵 Este mes (por fecha de creación)
    const esteMes = contratos.filter(c => {
      const fecha = new Date(c.createdAt);
      return (
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    });

// 🚨 Próximos a vencer (sidebar 30 días)
const proximos = activos
  .filter(c => {
    const dias = (new Date(c.vigenciaFin) - hoy) / (1000 * 60 * 60 * 24);
    return dias <= 30; // 🔥 antes era 7
  })
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

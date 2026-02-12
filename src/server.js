// src/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { connectDB } = require('./config/db');

// Modelos y rutas
const FileMeta = require('./models/FileMeta');
const Convenio = require('./models/Convenio');
const filesRouter = require('./routes/files');
const homeRoutes = require('./routes/home');
const conveniosRoutes = require('./routes/convenios');
const apiConvenios = require('./routes/convenios');

const app = express(); // 🔹 app debe declararse antes de usarlo
const PORT = process.env.PORT || 3000;

// 🔌 Conexión a MongoDB
async function start() {
  const MONGO_URI = process.env.MONGO_URI ||
    'mongodb+srv://BaseDeDatos:leprechaun12@cluster0.v591igu.mongodb.net/?appName=Cluster0';

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI no definido');
    process.exit(1);
  }

  await connectDB(MONGO_URI);
  console.log('Conectado a MongoDB y GridFS inicializado');

  // 📦 Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.static('public'));

  // 🛡️ Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https:"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      }
    })
  );

  // 🖼️ Vistas
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // 🔌 API
  app.use('/api/files', filesRouter);
  app.use('/api/convenios', apiConvenios); // ✅ API convenios

  // 🌐 Rutas principales
  app.use('/', homeRoutes);
  app.use('/convenios', conveniosRoutes);

  // 📅 Documentos por vencer
  app.get('/expiring', async (req, res) => {
    try {
      const today = new Date();
      const limitDate = new Date();
      limitDate.setDate(today.getDate() + 30);

      const files = await FileMeta.find({
        vigenciaFin: { $gte: today, $lte: limitDate }
      }).sort({ vigenciaFin: 1 }).lean();

      res.render('expiring', { title: 'Documentos por vencer', files });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al cargar documentos por vencer');
    }
  });

  // 📤 Subir PDF
  app.get('/upload', (req, res) =>
    res.render('upload', { title: 'Subir PDF' })
  );

  // 📂 Gestionar PDFs
  app.get('/manage', async (req, res) => {
    try {
      const convenios = await Convenio.find().sort({ numeroConvenio: 1 }).lean();
      res.render('manage', { title: 'Gestionar Convenios', convenios });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al cargar convenios');
    }
  });

  // 🔎 Buscador de convenios
  app.get('/search', async (req, res) => {
    try {
      const q = req.query.q || '';
      const query = { $or: [{ nombreUR: { $regex: q, $options: 'i' } }] };

      if (!isNaN(Number(q))) {
        query.$or.push({ numeroConvenio: Number(q) });
      }

      const items = await Convenio.find(query).sort({ numeroConvenio: 1 }).lean();
      res.render('manage', { title: 'Resultados de búsqueda', convenios: items });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error en la búsqueda de convenios');
    }
  });

  // ✏️ Editar PDF
  app.get('/edit/:id', (req, res) =>
    res.render('edit', { title: 'Editar PDF', id: req.params.id })
  );

  // ❌ 404
  app.use((req, res) => {
    res.status(404).render('404', { title: 'No encontrado' });
  });

  // 💥 Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('❌ Error al iniciar:', err);
  process.exit(1);
});

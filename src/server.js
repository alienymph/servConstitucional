// src/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const filesRouter = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3000;

async function start() {
  const MONGO_URI = process.env.MONGO_URI ||
    'mongodb+srv://BaseDeDatos:leprechaun12@cluster0.v591igu.mongodb.net/?appName=Cluster0';

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI no definido');
    process.exit(1);
  }

  // 🔌 MongoDB
  await connectDB(MONGO_URI);

  // 📦 Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 📁 Archivos estáticos
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // 🛡️ Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"]
        }
      }
    })
  );

  // 🖼️ Vistas
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // 🔌 API
  app.use('/api/files', filesRouter);

  // ======================
  // 🌐 RUTAS UI
  // ======================

  app.get('/', (req, res) =>
    res.render('home', { title: 'Inicio' })
  );

  app.get('/upload', (req, res) =>
    res.render('upload', { title: 'Subir PDF' })
  );

  app.get('/manage', (req, res) =>
    res.render('manage', { title: 'Gestionar PDFs' })
  );

  const FileMeta = require('./models/FileMeta');

app.get('/expiring', async (req, res) => {
  try {
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() + 30);

    const files = await FileMeta.find({
      vigenciaFin: { $gte: today, $lte: limitDate }
    }).sort({ vigenciaFin: 1 }).lean();

    res.render('expiring', {
      title: 'Documentos por vencer',
      files
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar documentos por vencer');
  }
});


  app.get('/edit/:id', (req, res) =>
    res.render('edit', { title: 'Editar PDF', id: req.params.id })
  );

  // ======================
  // ❌ 404
  // ======================
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

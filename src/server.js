// src/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const methodOverride = require('method-override');
const { connectDB } = require('./config/db');
const vinculacionesRouter = require('./routes/vinculaciones');
const contratosRouter = require('./routes/contratos');

// ─── Declarar app ─────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Modelos y routers ───────────────────────
const FileMeta = require('./models/FileMeta');
const filesRouter = require('./routes/files');
const homeRoutes = require('./routes/home');
const conveniosRouter = require('./routes/convenios'); // Si ya tienes convenios

// ─── Middlewares ─────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static('public'));

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

// ─── Vistas ─────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Conexión a MongoDB ─────────────────────
async function start() {
  const MONGO_URI = process.env.MONGO_URI || 
    'mongodb+srv://BaseDeDatos:leprechaun12@cluster0.v591igu.mongodb.net/?appName=Cluster0';

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI no definido');
    process.exit(1);
  }

  await connectDB(MONGO_URI);
  console.log('✅ Conectado a MongoDB y GridFS inicializado');

  // ─── Rutas ────────────────────────────────
  app.use('/api/files', filesRouter);
  app.use('/', homeRoutes);
  app.use('/vinculaciones', vinculacionesRouter);
  app.use('/contratos', contratosRouter);
  app.use('/', conveniosRouter);

  // ─── Otras rutas de ejemplo ───────────────

  app.get('/upload', (req, res) =>
    res.render('upload', { title: 'Nuevo Convenio' })
  );

  app.get('/manage', (req, res) => {
    res.render('manage', { title: 'Gestionar Convenios' });
  });

  app.get('/edit/:id', (req, res) =>
    res.render('edit', { title: 'Editar PDF', id: req.params.id })
  );

  // Documentos próximos a vencer
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

  // ─── 404 ──────────────────────────────────
  app.use((req, res) => {
    res.status(404).render('404', { title: 'No encontrado' });
  });

  // ─── Error handler ───────────────────────
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  });

  // ─── Servidor ───────────────────────────
  app.listen(PORT, () => {
    console.log(`🚀 Server corriendo en http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('❌ Error al iniciar:', err);
  process.exit(1);
});

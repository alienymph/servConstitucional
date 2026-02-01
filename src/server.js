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
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://esli1234567_db_user:eK7UtRigJYFUTC0y@cluster0.urccskn.mongodb.net/?appName=Cluster0';
  if (!MONGO_URI) {
    console.error('MONGO_URI no definido en .env');
    process.exit(1);
  }

  // Conectar a MongoDB y preparar GridFS
  await connectDB(MONGO_URI);

  // Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir archivos estáticos (public)
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Helmet con CSP razonable para desarrollo
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        objectSrc: ["'none'"]
      }
    }
  }));

  // Vistas
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Rutas API
  app.use('/api/files', filesRouter);

  // Rutas UI
  app.get('/', (req, res) => res.redirect('/upload'));
  app.get('/upload', (req, res) => res.render('upload'));
  app.get('/manage', (req, res) => res.render('manage'));
app.get('/create', (req, res) => res.render('create'));
app.get('/create', (req, res) => res.render('edit'));
  // Catch-all al final
  app.use((req, res) => res.status(404).send('Not Found'));

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Fallo al iniciar la app:', err);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const cursoRoutes = require('./src/routes/cursoRoutes');
app.use('/api/cursos', cursoRoutes);

const moduloRoutes = require('./src/routes/moduloRoutes');
app.use('/api/modulos', moduloRoutes);

const preguntaRoutes = require('./src/routes/preguntaRoutes');
app.use('/api/modulos/:moduloId/preguntas', preguntaRoutes);
app.use('/api/preguntas', preguntaRoutes);

const inscripcionRoutes = require('./src/routes/inscripcionRoutes');
app.use('/api/inscripciones', inscripcionRoutes);

const usuarioRoutes = require('./src/routes/usuarioRoutes');
app.use('/api/usuarios', usuarioRoutes);

const carritoRoutes = require('./src/routes/carritoRoutes');
app.use('/api/carrito', carritoRoutes);

const favoritoRoutes = require('./src/routes/favoritoRoutes');
app.use('/api/favoritos', favoritoRoutes);

const progresoRoutes = require('./src/routes/progresoRoutes');
app.use('/api/progreso', progresoRoutes);

const contenidoRoutes = require('./src/routes/contenidoRoutes');
app.use('/api/contenidos', contenidoRoutes);

const certificadoRoutes = require('./src/routes/certificadoRoutes');
app.use('/api/certificados', certificadoRoutes);

const reporteRoutes = require('./src/routes/reporteRoutes');
app.use('/api/reportes', reporteRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de la plataforma de cursos funcionando' });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

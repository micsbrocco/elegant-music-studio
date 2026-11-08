require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
// Detrás del proxy del hosting, para que req.ip sea la IP real de quien visita
app.set('trust proxy', 1);

// Headers de seguridad estándar (no dejar que la API se muestre dentro de otra
// página, no adivinar tipos de archivo, forzar https, etc.)
app.use(helmet());

// CORS: en producción solo acepta pedidos desde el frontend publicado
// (FRONTEND_URL, se pueden poner varias separadas por coma). En desarrollo, todo.
const origenesPermitidos = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' && origenesPermitidos.length > 0 ? origenesPermitidos : true,
  credentials: true, // la cookie de sesión
}));
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

const bloqueRoutes = require('./src/routes/bloqueRoutes');
app.use('/api/bloques', bloqueRoutes);

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

const landingRoutes = require('./src/routes/landingRoutes');
app.use('/api/landing', landingRoutes);

const pagoRoutes = require('./src/routes/pagoRoutes');
app.use('/api/pagos', pagoRoutes);

const arrepentimientoRoutes = require('./src/routes/arrepentimientoRoutes');
app.use('/api/arrepentimiento', arrepentimientoRoutes);

const notificacionRoutes = require('./src/routes/notificacionRoutes');
app.use('/api/notificaciones', notificacionRoutes);

const consultaRoutes = require('./src/routes/consultaRoutes');
app.use('/api/consultas', consultaRoutes);

// Configuración general del sitio (interruptor "Próximamente")
app.use('/api/sitio', require('./src/routes/sitioRoutes'));

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de la plataforma de cursos funcionando' });
});

// Manejador de errores global: convierte errores de multer (subida de archivos) y cualquier
// otro error no atrapado en una respuesta JSON prolija en vez de un stack trace crudo.
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const limite = err.field === 'archivo' ? '50MB' : '20MB';
      return res.status(400).json({ error: `El archivo es demasiado pesado. El máximo permitido es ${limite}.` });
    }
    return res.status(400).json({ error: 'Error al subir el archivo' });
  }
  if (err && err.esErrorDeValidacion) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor' });
  }
  next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  // Tarea diaria: alumnos inactivos y borrado de cursos archivados vencidos
  require('./src/jobs/mantenimiento').iniciarMantenimiento();
});

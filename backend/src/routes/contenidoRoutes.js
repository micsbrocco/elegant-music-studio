const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  crearContenido,
  obtenerContenido,
  editarContenido,
  moverContenido,
  eliminarContenido,
  reordenarContenido,
  reordenarContenidosLote,
  subirArchivoLeccion,
  firmarUrlArchivoAdmin,
  obtenerUrlArchivo,
} = require('../controllers/contenidoController');
const { verificarToken, verificarAdminOInstructor } = require('../middlewares/authMiddleware');
const { uploadArchivoLeccion } = require('../middlewares/uploadMiddleware');
const bloqueRoutes = require('./bloqueRoutes');

router.put('/reordenar-lote', verificarToken, verificarAdminOInstructor, reordenarContenidosLote);
router.post('/subir-archivo', verificarToken, verificarAdminOInstructor, uploadArchivoLeccion.single('archivo'), subirArchivoLeccion);
router.post('/firmar-url-admin', verificarToken, verificarAdminOInstructor, firmarUrlArchivoAdmin);
router.get('/archivos/:archivoId/url', verificarToken, obtenerUrlArchivo);
router.get('/:id', verificarToken, obtenerContenido);
router.post('/', verificarToken, verificarAdminOInstructor, crearContenido);
router.put('/:id', verificarToken, verificarAdminOInstructor, editarContenido);
router.put('/:id/mover', verificarToken, verificarAdminOInstructor, moverContenido);
router.delete('/:id', verificarToken, verificarAdminOInstructor, eliminarContenido);
router.put('/:id/reordenar', verificarToken, verificarAdminOInstructor, reordenarContenido);

// Los bloques (texto/quiz) de una clase de tipo "bloques" viven acá. Las
// preguntas de un quiz, a su vez, cuelgan de cada bloque (ver bloqueRoutes).
router.use('/:contenidoId/bloques', bloqueRoutes);

module.exports = router;
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  crearPregunta,
  listarPreguntasPorBloque,
  listarPreguntasAdmin,
  obtenerPregunta,
  editarPregunta,
  eliminarPregunta,
  responderPregunta,
} = require('../controllers/preguntaController');
const { verificarToken, verificarTokenOpcional, verificarAdminOInstructor } = require('../middlewares/authMiddleware');

router.post('/:id/responder', verificarToken, responderPregunta);
router.get('/', verificarToken, listarPreguntasPorBloque);
router.get('/admin', verificarToken, verificarAdminOInstructor, listarPreguntasAdmin);
router.get('/:id', verificarToken, verificarAdminOInstructor, obtenerPregunta);
router.post('/', verificarToken, verificarAdminOInstructor, crearPregunta);
router.put('/:id', verificarToken, verificarAdminOInstructor, editarPregunta);
router.delete('/:id', verificarToken, verificarAdminOInstructor, eliminarPregunta);

module.exports = router;

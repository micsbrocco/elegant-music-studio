const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  crearPregunta,
  listarPreguntasPorContenido,
  listarPreguntasAdmin,
  obtenerPregunta,
  editarPregunta,
  eliminarPregunta,
  responderPregunta,
} = require('../controllers/preguntaController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');

router.post('/:id/responder', verificarToken, responderPregunta);
router.get('/', listarPreguntasPorContenido);
router.get('/admin', verificarToken, verificarAdmin, listarPreguntasAdmin);
router.get('/:id', verificarToken, verificarAdmin, obtenerPregunta);
router.post('/', verificarToken, verificarAdmin, crearPregunta);
router.put('/:id', verificarToken, verificarAdmin, editarPregunta);
router.delete('/:id', verificarToken, verificarAdmin, eliminarPregunta);

module.exports = router;

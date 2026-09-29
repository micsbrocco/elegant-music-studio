const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  crearContenido,
  obtenerContenido,
  editarContenido,
  eliminarContenido,
  reordenarContenido,
} = require('../controllers/contenidoController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');
const preguntaRoutes = require('./preguntaRoutes');

router.get('/:id', obtenerContenido);
router.post('/', verificarToken, verificarAdmin, crearContenido);
router.put('/:id', verificarToken, verificarAdmin, editarContenido);
router.delete('/:id', verificarToken, verificarAdmin, eliminarContenido);
router.put('/:id/reordenar', verificarToken, verificarAdmin, reordenarContenido);

router.use('/:contenidoId/preguntas', preguntaRoutes);

module.exports = router;
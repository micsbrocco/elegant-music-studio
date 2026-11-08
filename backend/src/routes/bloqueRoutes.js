const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  crearBloque,
  editarBloque,
  eliminarBloque,
  reordenarBloquesLote,
} = require('../controllers/bloqueController');
const { verificarToken, verificarAdminOInstructor } = require('../middlewares/authMiddleware');
const preguntaRoutes = require('./preguntaRoutes');

router.put('/reordenar-lote', verificarToken, verificarAdminOInstructor, reordenarBloquesLote);
router.post('/', verificarToken, verificarAdminOInstructor, crearBloque);
router.put('/:id', verificarToken, verificarAdminOInstructor, editarBloque);
router.delete('/:id', verificarToken, verificarAdminOInstructor, eliminarBloque);

router.use('/:bloqueId/preguntas', preguntaRoutes);

module.exports = router;

const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  crearModulo,
  obtenerModulo,
  editarModulo,
  eliminarModulo,
  reordenarModulo,
  reordenarModulosLote,
} = require('../controllers/moduloController');
const { verificarToken, verificarAdminOInstructor } = require('../middlewares/authMiddleware');
const contenidoRoutes = require('./contenidoRoutes');

router.put('/reordenar-lote', verificarToken, verificarAdminOInstructor, reordenarModulosLote);
router.get('/:id', verificarToken, obtenerModulo);
router.post('/', verificarToken, verificarAdminOInstructor, crearModulo);
router.put('/:id', verificarToken, verificarAdminOInstructor, editarModulo);
router.delete('/:id', verificarToken, verificarAdminOInstructor, eliminarModulo);
router.put('/:id/reordenar', verificarToken, verificarAdminOInstructor, reordenarModulo);

router.use('/:moduloId/contenidos', contenidoRoutes);

module.exports = router;
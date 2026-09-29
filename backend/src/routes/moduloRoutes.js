const express = require('express');
const router = express.Router({ mergeParams: true });
const { crearModulo, obtenerModulo, editarModulo, eliminarModulo, reordenarModulo } = require('../controllers/moduloController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');
const contenidoRoutes = require('./contenidoRoutes');

router.get('/:id', obtenerModulo);
router.post('/', verificarToken, verificarAdmin, crearModulo);
router.put('/:id', verificarToken, verificarAdmin, editarModulo);
router.delete('/:id', verificarToken, verificarAdmin, eliminarModulo);
router.put('/:id/reordenar', verificarToken, verificarAdmin, reordenarModulo);

router.use('/:moduloId/contenidos', contenidoRoutes);

module.exports = router;
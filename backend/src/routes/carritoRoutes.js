const express = require('express');
const router = express.Router();
const { agregarAlCarrito, verCarrito, quitarDelCarrito, comprarCarrito } = require('../controllers/carritoController');
const { verificarToken, soloSiCompraSimuladaHabilitada } = require('../middlewares/authMiddleware');
const { soloSiCursosAbiertos } = require('../utils/modoSitio');

router.get('/', verificarToken, verCarrito);
router.post('/', verificarToken, soloSiCursosAbiertos, agregarAlCarrito);
router.delete('/:id', verificarToken, quitarDelCarrito);
router.post('/comprar', verificarToken, soloSiCompraSimuladaHabilitada, comprarCarrito);

module.exports = router;
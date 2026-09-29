const express = require('express');
const router = express.Router();
const { agregarAlCarrito, verCarrito, quitarDelCarrito, comprarCarrito } = require('../controllers/carritoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, verCarrito);
router.post('/', verificarToken, agregarAlCarrito);
router.delete('/:id', verificarToken, quitarDelCarrito);
router.post('/comprar', verificarToken, comprarCarrito);

module.exports = router;
const express = require('express');
const router = express.Router();
const { obtenerSitio, actualizarSitio } = require('../controllers/sitioController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');

router.get('/', obtenerSitio);
router.put('/', verificarToken, verificarAdmin, actualizarSitio);

module.exports = router;

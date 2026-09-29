const express = require('express');
const router = express.Router();
const { marcarProgreso, obtenerProgresoCurso } = require('../controllers/progresoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.put('/contenido/:contenidoId', verificarToken, marcarProgreso);
router.get('/curso/:cursoId', verificarToken, obtenerProgresoCurso);

module.exports = router;
const express = require('express');
const router = express.Router();
const { marcarProgreso, obtenerProgresoCurso, marcarVideoVisto } = require('../controllers/progresoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.put('/contenido/:contenidoId', verificarToken, marcarProgreso);
router.post('/video/:contenidoId', verificarToken, marcarVideoVisto);
router.get('/curso/:cursoId', verificarToken, obtenerProgresoCurso);

module.exports = router;
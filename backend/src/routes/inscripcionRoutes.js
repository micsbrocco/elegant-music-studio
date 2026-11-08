const express = require('express');
const router = express.Router();
const { comprarCurso, misCursos, verificarInscripcion } = require('../controllers/inscripcionController');
const { verificarToken, soloSiCompraSimuladaHabilitada } = require('../middlewares/authMiddleware');

router.post('/comprar', verificarToken, soloSiCompraSimuladaHabilitada, comprarCurso);
router.get('/mis-cursos', verificarToken, misCursos);
router.get('/verificar/:cursoId', verificarToken, verificarInscripcion);

module.exports = router;
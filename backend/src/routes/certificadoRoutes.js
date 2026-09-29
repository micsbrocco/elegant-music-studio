const express = require('express');
const router = express.Router();
const { emitirCertificado, obtenerCertificado } = require('../controllers/certificadoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/:inscripcionId/emitir', verificarToken, emitirCertificado);
router.get('/:inscripcionId', verificarToken, obtenerCertificado);

module.exports = router;
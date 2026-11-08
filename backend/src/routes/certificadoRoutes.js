const express = require('express');
const router = express.Router();
const { emitirCertificado, obtenerCertificado, listarMisCertificados, verificarCertificado } = require('../controllers/certificadoController');
const { limiteVerificacion } = require('../middlewares/limiteIntentos');
const { verificarToken } = require('../middlewares/authMiddleware');

// Pública (sin sesión): la usa la página de verificación
router.get('/verificar/:codigo', limiteVerificacion, verificarCertificado);
router.get('/mios', verificarToken, listarMisCertificados);
router.post('/:inscripcionId/emitir', verificarToken, emitirCertificado);
router.get('/:inscripcionId', verificarToken, obtenerCertificado);

module.exports = router;
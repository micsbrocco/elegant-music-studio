const express = require('express');
const router = express.Router();
const { crearSolicitud, listarSolicitudes, cambiarEstadoSolicitud, obtenerPolitica } = require('../controllers/arrepentimientoController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');
const { limiteArrepentimiento } = require('../middlewares/limiteIntentos');

// Público: el Botón de arrepentimiento no puede exigir iniciar sesión
router.post('/', limiteArrepentimiento, crearSolicitud);
router.get('/politica', obtenerPolitica);

// Panel de administración
router.get('/', verificarToken, verificarAdmin, listarSolicitudes);
router.patch('/:id', verificarToken, verificarAdmin, cambiarEstadoSolicitud);

module.exports = router;

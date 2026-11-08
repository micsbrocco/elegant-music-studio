const express = require('express');
const router = express.Router();
const {
  misConsultasRecientes, misConsultasDeClase, crearConsulta, listarConsultas, contarPendientes, responderConsulta,
} = require('../controllers/consultaController');
const { verificarToken, verificarAdminOInstructor } = require('../middlewares/authMiddleware');

// Alumno (y quien pruebe el curso como alumno)
router.get('/mias', verificarToken, misConsultasRecientes);
router.get('/clase/:idContenido', verificarToken, misConsultasDeClase);
router.post('/clase/:idContenido', verificarToken, crearConsulta);

// Panel
router.get('/', verificarToken, verificarAdminOInstructor, listarConsultas);
router.get('/pendientes', verificarToken, verificarAdminOInstructor, contarPendientes);
router.post('/:id/responder', verificarToken, verificarAdminOInstructor, responderConsulta);

module.exports = router;

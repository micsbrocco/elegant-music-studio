const express = require('express');
const router = express.Router();
const { listarNotificaciones, marcarLeida, marcarTodasLeidas } = require('../controllers/notificacionController');
const { verificarToken, verificarAdminOInstructor } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, verificarAdminOInstructor, listarNotificaciones);
router.patch('/leidas', verificarToken, verificarAdminOInstructor, marcarTodasLeidas);
router.patch('/:id/leida', verificarToken, verificarAdminOInstructor, marcarLeida);

module.exports = router;

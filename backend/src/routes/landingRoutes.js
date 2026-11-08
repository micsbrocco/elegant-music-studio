const express = require('express');
const router = express.Router();
const { obtenerLanding, actualizarLanding, subirFotoLanding } = require('../controllers/landingController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Pública: la lee la home
router.get('/', obtenerLanding);

// Solo admin: la usa el editor del panel
router.put('/', verificarToken, verificarAdmin, actualizarLanding);
router.post('/foto', verificarToken, verificarAdmin, upload.single('foto'), subirFotoLanding);

module.exports = router;

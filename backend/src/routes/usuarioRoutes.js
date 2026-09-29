const express = require('express');
const router = express.Router();
const { obtenerPerfil, editarPerfil, subirFotoPerfil } = require('../controllers/usuarioController');
const { verificarToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, editarPerfil);
router.post('/perfil/foto', verificarToken, upload.single('foto'), subirFotoPerfil);

module.exports = router;
const express = require('express');
const router = express.Router();
const { registrar, login, solicitarRecuperacion, resetearPassword } = require('../controllers/authController');

router.post('/registro', registrar);
router.post('/login', login);
router.post('/recuperar-password', solicitarRecuperacion);
router.post('/resetear-password', resetearPassword);

module.exports = router;
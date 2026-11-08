const express = require('express');
const router = express.Router();
const { renovar, logout, registrar, login, loginConGoogle, solicitarRecuperacion, resetearPassword, verificarEmail } = require('../controllers/authController');
const { soloSiCursosAbiertos } = require('../utils/modoSitio');
const { limiteLoginPorCuenta, limiteLoginPorIp, limiteEnvioMails, limiteCodigos } = require('../middlewares/limiteIntentos');

// Límites de intentos: ver middlewares/limiteIntentos.js
// En "Próximamente" no se crean cuentas nuevas
router.post('/registro', limiteEnvioMails, soloSiCursosAbiertos, registrar);
router.post('/login', limiteLoginPorIp, limiteLoginPorCuenta, login);
router.post('/google', limiteLoginPorIp, loginConGoogle);
router.post('/recuperar-password', limiteEnvioMails, solicitarRecuperacion);
router.post('/resetear-password', limiteCodigos, resetearPassword);
router.get('/verificar-email', limiteCodigos, verificarEmail);

// Usan la cookie de sesión. El header X-Sesion lo pone solo nuestro frontend:
// un formulario de otro sitio no puede agregarlo, así que no pueden forzar estos pedidos.
function soloDesdeLaApp(req, res, next) {
  if (req.headers['x-sesion'] !== '1') return res.status(403).json({ error: 'Pedido no permitido' });
  next();
}
router.post('/renovar', soloDesdeLaApp, renovar);
router.post('/logout', soloDesdeLaApp, logout);

module.exports = router;
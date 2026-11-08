const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { soloSiCursosAbiertos } = require('../utils/modoSitio');
const { crearPreferencia, recibirWebhook, confirmarPago, misCompras } = require('../controllers/pagoController');

router.post('/preferencia', verificarToken, soloSiCursosAbiertos, crearPreferencia);
router.post('/confirmar', verificarToken, confirmarPago);

// Sin verificarToken: la llama Mercado Pago, no un alumno
router.post('/webhook', recibirWebhook);
router.get('/mis-compras', verificarToken, misCompras);

module.exports = router;
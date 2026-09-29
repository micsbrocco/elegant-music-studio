const express = require('express');
const router = express.Router();
const { agregarFavorito, verFavoritos, quitarFavorito } = require('../controllers/favoritoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, verFavoritos);
router.post('/', verificarToken, agregarFavorito);
router.delete('/:id', verificarToken, quitarFavorito);

module.exports = router;
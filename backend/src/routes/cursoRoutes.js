const express = require('express');
const router = express.Router();
const {
  crearCurso,
  listarCursos,
  obtenerCurso,
  editarCurso,
  eliminarCurso,
} = require('../controllers/cursoController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');
const moduloRoutes = require('./moduloRoutes');

// Rutas públicas
router.get('/', listarCursos);
router.get('/:id', obtenerCurso);

// Rutas protegidas (solo admin)
router.post('/', verificarToken, verificarAdmin, crearCurso);
router.put('/:id', verificarToken, verificarAdmin, editarCurso);
router.delete('/:id', verificarToken, verificarAdmin, eliminarCurso);
router.use('/:cursoId/modulos', moduloRoutes);

module.exports = router;
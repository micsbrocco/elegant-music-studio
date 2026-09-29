const express = require('express');
const router = express.Router();
const {
  obtenerResumen,
  listarAlumnos,
  listarVentas,
  exportarAlumnosExcel,
  exportarVentasExcel,
} = require('../controllers/reporteController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');

router.get('/resumen', verificarToken, verificarAdmin, obtenerResumen);
router.get('/alumnos', verificarToken, verificarAdmin, listarAlumnos);
router.get('/ventas', verificarToken, verificarAdmin, listarVentas);
router.get('/alumnos/exportar', verificarToken, verificarAdmin, exportarAlumnosExcel);
router.get('/ventas/exportar', verificarToken, verificarAdmin, exportarVentasExcel);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  obtenerResumen,
  obtenerVentasPeriodo,
  obtenerAlmacenamiento,
  listarAlumnos,
  reactivarAlumno,
  listarVentas,
  listarCursosParaFiltro,
  obtenerPrimeraVenta,
  exportarAlumnosExcel,
  exportarVentasExcel,
  obtenerDetalleVenta,
  listarCursosConAlumnos,
  listarAlumnosDeCurso,
} = require('../controllers/reporteController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');

router.get('/resumen', verificarToken, verificarAdmin, obtenerResumen);
router.get('/ventas-periodo', verificarToken, verificarAdmin, obtenerVentasPeriodo);
router.get('/almacenamiento', verificarToken, verificarAdmin, obtenerAlmacenamiento);
router.get('/alumnos', verificarToken, verificarAdmin, listarAlumnos);
router.get('/cursos-alumnos', verificarToken, verificarAdmin, listarCursosConAlumnos);
router.get('/cursos/:id/alumnos', verificarToken, verificarAdmin, listarAlumnosDeCurso);
router.patch('/alumnos/:id/reactivar', verificarToken, verificarAdmin, reactivarAlumno);
router.get('/ventas', verificarToken, verificarAdmin, listarVentas);
router.get('/cursos-filtro', verificarToken, verificarAdmin, listarCursosParaFiltro);
router.get('/primera-venta', verificarToken, verificarAdmin, obtenerPrimeraVenta);
router.get('/alumnos/exportar', verificarToken, verificarAdmin, exportarAlumnosExcel);
router.get('/ventas/exportar', verificarToken, verificarAdmin, exportarVentasExcel);
router.get('/ventas/:id/detalle', verificarToken, verificarAdmin, obtenerDetalleVenta);

module.exports = router;
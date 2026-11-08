const express = require('express');
const router = express.Router();
const {
  obtenerPerfil, editarPerfil, subirFotoPerfil, cambiarPassword, listarInstructores,
  listarUsuariosParaInstructores, cambiarRolUsuario, listarCursosDeUsuario,
  listarHistorialInstructores, exportarHistorialInstructores,
} = require('../controllers/usuarioController');
const { verificarToken, verificarAdmin, verificarAdminOInstructor } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, editarPerfil);
router.post('/perfil/foto', verificarToken, upload.single('foto'), subirFotoPerfil);
router.put('/password', verificarToken, cambiarPassword);
// Antes era admin-only; ahora también la necesita un instructor para elegir a
// quién agregar como editor/colaborador de un curso.
router.get('/instructores', verificarToken, verificarAdminOInstructor, listarInstructores);
router.get('/para-instructores', verificarToken, verificarAdmin, listarUsuariosParaInstructores);
// Registro de altas y bajas de instructores (con filtros) y su exportación a Excel
router.get('/instructores/historial', verificarToken, verificarAdmin, listarHistorialInstructores);
router.get('/instructores/historial/exportar', verificarToken, verificarAdmin, exportarHistorialInstructores);
router.get('/:id/cursos', verificarToken, verificarAdmin, listarCursosDeUsuario);
router.patch('/:id/rol', verificarToken, verificarAdmin, cambiarRolUsuario);

module.exports = router;
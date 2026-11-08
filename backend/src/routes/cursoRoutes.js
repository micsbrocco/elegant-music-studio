const express = require('express');
const router = express.Router();
const {
  crearCurso,
  listarCursos,
  listarCursosAdmin,
  listarCategorias,
  obtenerCurso,
  editarCurso,
  cambiarEstadoCurso,
  solicitarPublicacion,
  devolverCurso,
  listarMensajesRevision,
  actualizarMensajeRevision,
  eliminarCurso,
  subirFotoCurso,
  agregarColaborador,
  actualizarColaborador,
  quitarColaborador,
} = require('../controllers/cursoController');
const { verificarToken, verificarAdmin, verificarAdminOInstructor, verificarTokenOpcional } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { soloSiCursosAbiertos, soloSiCursoVisible } = require('../utils/modoSitio');
const moduloRoutes = require('./moduloRoutes');

// Rutas públicas
// En "Próximamente" el catálogo y el detalle quedan cerrados al público (ver utils/modoSitio.js)
router.get('/', verificarTokenOpcional, soloSiCursosAbiertos, listarCursos);
// Admin ve todos los cursos; un instructor ve solo los suyos (filtrado en el controller)
router.get('/admin/todos', verificarToken, verificarAdminOInstructor, listarCursosAdmin);
router.get('/admin/categorias', verificarToken, verificarAdminOInstructor, listarCategorias);
// Público (vidriera), pero con auth opcional: si viene un token válido, obtenerCurso lo usa
// para saber si es admin, el instructor dueño o un alumno inscripto, y devolver el
// contenido completo de las clases.
router.get('/:id', verificarTokenOpcional, soloSiCursoVisible, obtenerCurso);

// Crear/editar/subir foto: admin o instructor (la pertenencia del curso puntual se
// valida dentro de cada controller). Cambiar el estado y eliminar siguen siendo
// exclusivos del admin: un instructor nunca publica ni borra un curso por su cuenta.
router.post('/', verificarToken, verificarAdminOInstructor, crearCurso);
router.post('/subir-foto', verificarToken, verificarAdminOInstructor, upload.single('foto'), subirFotoCurso);
router.put('/:id', verificarToken, verificarAdminOInstructor, editarCurso);
router.patch('/:id/estado', verificarToken, verificarAdmin, cambiarEstadoCurso);
router.post('/:id/solicitar-publicacion', verificarToken, verificarAdminOInstructor, solicitarPublicacion);
router.post('/:id/devolver', verificarToken, verificarAdmin, devolverCurso);
router.get('/:id/mensajes-revision', verificarToken, verificarAdminOInstructor, listarMensajesRevision);
router.patch('/:id/mensajes-revision/:idMensaje', verificarToken, verificarAdminOInstructor, actualizarMensajeRevision);
router.delete('/:id', verificarToken, verificarAdmin, eliminarCurso);

// Instructores/colaboradores del curso: cualquiera que ya tenga acceso al
// curso puede agregar, sacar, o cambiar la visibilidad/etiqueta/orden de otro.
router.post('/:id/colaboradores', verificarToken, verificarAdminOInstructor, agregarColaborador);
router.patch('/:id/colaboradores/:idUsuario', verificarToken, verificarAdminOInstructor, actualizarColaborador);
router.delete('/:id/colaboradores/:idUsuario', verificarToken, verificarAdminOInstructor, quitarColaborador);

router.use('/:cursoId/modulos', moduloRoutes);

module.exports = router;
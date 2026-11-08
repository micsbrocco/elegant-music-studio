import api from './api';

export async function listarCursosRequest() {
  const response = await api.get('/cursos');
  return response.data;
}

// params.estado: 'activo' | 'oculto' | 'borrador' | 'archivado'. Sin estado
// trae todos menos los archivados.
export async function listarCursosAdminRequest(params = {}) {
  const response = await api.get('/cursos/admin/todos', { params });
  return response.data;
}

export async function cambiarEstadoCursoRequest(id, estado) {
  const response = await api.patch(`/cursos/${id}/estado`, { estado });
  return response.data;
}

export async function obtenerCursoRequest(id) {
  const response = await api.get(`/cursos/${id}`);
  return response.data;
}

export async function crearCursoRequest(datosCurso) {
  const response = await api.post('/cursos', datosCurso);
  return response.data;
}

export async function editarCursoRequest(id, datosCurso) {
  const response = await api.put(`/cursos/${id}`, datosCurso);
  return response.data;
}

// Categorías que ya se usan (para la ventanita de "Nuevo curso")
export async function listarCategoriasRequest() {
  const response = await api.get('/cursos/admin/categorias');
  return response.data;
}

// Borrado lógico: el curso pasa a "archivado" (se puede restaurar)
export async function archivarCursoRequest(id) {
  const response = await api.patch(`/cursos/${id}/estado`, { estado: 'archivado' });
  return response.data;
}

export async function eliminarCursoRequest(id) {
  const response = await api.delete(`/cursos/${id}`);
  return response.data;
}

export async function subirFotoCursoRequest(archivo) {
  const formData = new FormData();
  formData.append('foto', archivo);

  const response = await api.post('/cursos/subir-foto', formData);
  return response.data;
}

export async function agregarColaboradorCursoRequest(idCurso, idUsuario) {
  const response = await api.post(`/cursos/${idCurso}/colaboradores`, { idUsuario });
  return response.data;
}

export async function actualizarColaboradorCursoRequest(idCurso, idUsuario, datos) {
  const response = await api.patch(`/cursos/${idCurso}/colaboradores/${idUsuario}`, datos);
  return response.data;
}

export async function quitarColaboradorCursoRequest(idCurso, idUsuario) {
  const response = await api.delete(`/cursos/${idCurso}/colaboradores/${idUsuario}`);
  return response.data;
}
// Instructor: pide que el admin publique el curso
export async function solicitarPublicacionRequest(id) {
  const response = await api.post(`/cursos/${id}/solicitar-publicacion`);
  return response.data;
}

// Admin: devuelve el curso al instructor con un comentario de lo que falta
export async function devolverCursoRequest(id, comentario) {
  const response = await api.post(`/cursos/${id}/devolver`, { comentario });
  return response.data;
}

// Historial de comentarios del administrador sobre el curso (devoluciones)
export async function listarMensajesRevisionRequest(id) {
  const response = await api.get(`/cursos/${id}/mensajes-revision`);
  return response.data;
}

// Marca un mensaje del admin como leído (instructor) o realizado (admin).
// cambios: { leido?: bool, resuelto?: bool }
export async function actualizarMensajeRevisionRequest(idCurso, idMensaje, cambios) {
  const response = await api.patch(`/cursos/${idCurso}/mensajes-revision/${idMensaje}`, cambios);
  return response.data;
}

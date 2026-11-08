import api from './api';

export async function obtenerPerfilRequest() {
  const response = await api.get('/usuarios/perfil');
  return response.data;
}

export async function editarPerfilRequest(datosPerfil) {
  const response = await api.put('/usuarios/perfil', datosPerfil);
  return response.data;
}

export async function subirFotoPerfilRequest(archivo) {
  const formData = new FormData();
  formData.append('foto', archivo);

  const response = await api.post('/usuarios/perfil/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function listarInstructoresRequest() {
  const response = await api.get('/usuarios/instructores');
  return response.data;
}

// params: { rol: 'profesor' | 'alumno', buscar, pagina }
export async function listarUsuariosParaInstructoresRequest(params = {}) {
  const response = await api.get('/usuarios/para-instructores', { params });
  return response.data;
}

export async function cambiarRolUsuarioRequest(id, rol) {
  const response = await api.patch(`/usuarios/${id}/rol`, { rol });
  return response.data;
}

export async function listarCursosDeUsuarioRequest(id) {
  const response = await api.get(`/usuarios/${id}/cursos`);
  return response.data;
}

export async function cambiarPasswordRequest(passwordActual, nuevaPassword) {
  const response = await api.put('/usuarios/password', { passwordActual, nuevaPassword });
  return response.data;
}

// Registro de altas y bajas de instructores. params: { desde, hasta, accion, buscar, pagina, porPagina }
export async function listarHistorialInstructoresRequest(params = {}) {
  const response = await api.get('/usuarios/instructores/historial', { params });
  return response.data;
}

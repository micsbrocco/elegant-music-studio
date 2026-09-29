import api from './api';

export async function listarCursosRequest() {
  const response = await api.get('/cursos');
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

export async function eliminarCursoRequest(id) {
  const response = await api.delete(`/cursos/${id}`);
  return response.data;
}
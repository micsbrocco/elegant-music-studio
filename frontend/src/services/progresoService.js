import api from './api';

export async function marcarProgresoRequest(contenidoId) {
  const response = await api.put(`/progreso/contenido/${contenidoId}`);
  return response.data;
}

export async function obtenerProgresoCursoRequest(cursoId) {
  const response = await api.get(`/progreso/curso/${cursoId}`);
  return response.data;
}
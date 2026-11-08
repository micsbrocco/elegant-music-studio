import api from './api';

export async function marcarProgresoRequest(contenidoId) {
  const response = await api.put(`/progreso/contenido/${contenidoId}`);
  return response.data;
}

export async function obtenerProgresoCursoRequest(cursoId) {
  const response = await api.get(`/progreso/curso/${cursoId}`);
  return response.data;
}
// Avance de una clase de video: tramos de 5 segundos que se vieron
export async function marcarVideoVistoRequest(contenidoId, tramos, duracion) {
  const response = await api.post(`/progreso/video/${contenidoId}`, { tramos, duracion });
  return response.data;
}

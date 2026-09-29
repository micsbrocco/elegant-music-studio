import api from './api';

export async function listarPreguntasRequest(contenidoId) {
  const response = await api.get(`/contenidos/${contenidoId}/preguntas`);
  return response.data;
}

export async function listarPreguntasAdminRequest(contenidoId) {
  const response = await api.get(`/contenidos/${contenidoId}/preguntas/admin`);
  return response.data;
}

export async function crearPreguntaRequest(contenidoId, datosPregunta) {
  const response = await api.post(`/contenidos/${contenidoId}/preguntas`, datosPregunta);
  return response.data;
}

export async function editarPreguntaRequest(id, datosPregunta) {
  const response = await api.put(`/preguntas/${id}`, datosPregunta);
  return response.data;
}

export async function eliminarPreguntaRequest(id) {
  const response = await api.delete(`/preguntas/${id}`);
  return response.data;
}

export async function responderPreguntaRequest(preguntaId, opcionElegida) {
  const response = await api.post(`/preguntas/${preguntaId}/responder`, { opcionElegida });
  return response.data;
}
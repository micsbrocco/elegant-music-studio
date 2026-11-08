import api from './api';

export async function listarPreguntasRequest(bloqueId) {
  const response = await api.get(`/bloques/${bloqueId}/preguntas`);
  return response.data;
}

export async function listarPreguntasAdminRequest(bloqueId) {
  const response = await api.get(`/bloques/${bloqueId}/preguntas/admin`);
  return response.data;
}

export async function crearPreguntaRequest(bloqueId, datosPregunta) {
  const response = await api.post(`/bloques/${bloqueId}/preguntas`, datosPregunta);
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
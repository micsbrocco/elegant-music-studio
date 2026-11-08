import api from './api';

// Alumno: sus preguntas en una clase y enviar una nueva
export async function misConsultasDeClaseRequest(idContenido) {
  const response = await api.get(`/consultas/clase/${idContenido}`);
  return response.data;
}

export async function crearConsultaRequest(idContenido, texto) {
  const response = await api.post(`/consultas/clase/${idContenido}`, { texto });
  return response.data;
}

// Panel: listar, contar y responder
export async function listarConsultasRequest(params = {}) {
  const response = await api.get('/consultas', { params });
  return response.data;
}

export async function contarConsultasPendientesRequest() {
  const response = await api.get('/consultas/pendientes');
  return response.data;
}

export async function responderConsultaRequest(id, respuesta) {
  const response = await api.post(`/consultas/${id}/responder`, { respuesta });
  return response.data;
}

// Alumno: sus últimas preguntas y cuántas respuestas todavía no vio
export async function misConsultasRecientesRequest() {
  const response = await api.get('/consultas/mias');
  return response.data;
}

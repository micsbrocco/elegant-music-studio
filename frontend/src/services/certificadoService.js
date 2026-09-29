import api from './api';

export async function emitirCertificadoRequest(inscripcionId) {
  const response = await api.post(`/certificados/${inscripcionId}/emitir`);
  return response.data;
}

export async function obtenerCertificadoRequest(inscripcionId) {
  const response = await api.get(`/certificados/${inscripcionId}`);
  return response.data;
}
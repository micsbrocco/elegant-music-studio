import api from './api';

export async function emitirCertificadoRequest(inscripcionId) {
  const response = await api.post(`/certificados/${inscripcionId}/emitir`);
  return response.data;
}

export async function obtenerCertificadoRequest(inscripcionId) {
  const response = await api.get(`/certificados/${inscripcionId}`);
  return response.data;
}

export async function misCertificadosRequest() {
  const response = await api.get('/certificados/mios');
  return response.data;
}

// Pública: verifica un certificado por su código (o el QR del PDF)
export async function verificarCertificadoRequest(codigo) {
  const response = await api.get(`/certificados/verificar/${encodeURIComponent(codigo)}`);
  return response.data; // { valido, codigo, nombre, curso, fechaEmision }
}

import api from './api';

// Público: no hace falta iniciar sesión
export async function enviarArrepentimientoRequest(datos) {
  const response = await api.post('/arrepentimiento', datos);
  return response.data;
}

export async function obtenerPoliticaArrepentimientoRequest() {
  const response = await api.get('/arrepentimiento/politica');
  return response.data;
}

// Panel de administración
export async function listarArrepentimientosRequest(params = {}) {
  const response = await api.get('/arrepentimiento', { params });
  return response.data;
}

export async function cambiarEstadoArrepentimientoRequest(id, estado) {
  const response = await api.patch(`/arrepentimiento/${id}`, { estado });
  return response.data;
}

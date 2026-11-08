import api from './api';

export async function obtenerSitioRequest() {
  const response = await api.get('/sitio');
  return response.data; // { proximamente }
}

export async function actualizarSitioRequest(proximamente) {
  const response = await api.put('/sitio', { proximamente });
  return response.data;
}

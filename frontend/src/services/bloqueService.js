import api from './api';

export async function crearBloqueRequest(contenidoId, tipo) {
  const response = await api.post(`/contenidos/${contenidoId}/bloques`, { tipo });
  return response.data;
}

export async function editarBloqueRequest(id, contenidoTexto) {
  const response = await api.put(`/bloques/${id}`, { contenidoTexto });
  return response.data;
}

export async function eliminarBloqueRequest(id) {
  const response = await api.delete(`/bloques/${id}`);
  return response.data;
}

export async function reordenarBloquesLoteRequest(contenidoId, idsOrdenados) {
  const response = await api.put(`/contenidos/${contenidoId}/bloques/reordenar-lote`, { ids: idsOrdenados });
  return response.data;
}

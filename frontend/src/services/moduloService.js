import api from './api';

export async function crearModuloRequest(cursoId, datosModulo) {
  const response = await api.post(`/cursos/${cursoId}/modulos`, datosModulo);
  return response.data;
}

export async function obtenerModuloRequest(id) {
  const response = await api.get(`/modulos/${id}`);
  return response.data;
}

export async function editarModuloRequest(id, datosModulo) {
  const response = await api.put(`/modulos/${id}`, datosModulo);
  return response.data;
}

export async function eliminarModuloRequest(id) {
  const response = await api.delete(`/modulos/${id}`);
  return response.data;
}

export async function reordenarModuloRequest(id, direccion) {
  const response = await api.put(`/modulos/${id}/reordenar`, { direccion });
  return response.data;
}

export async function reordenarModulosLoteRequest(idsOrdenados) {
  const response = await api.put('/modulos/reordenar-lote', { ids: idsOrdenados });
  return response.data;
}
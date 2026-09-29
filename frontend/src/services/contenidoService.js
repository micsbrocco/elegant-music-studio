import api from './api';

export async function crearContenidoRequest(moduloId, datosContenido) {
  const response = await api.post(`/modulos/${moduloId}/contenidos`, datosContenido);
  return response.data;
}

export async function obtenerContenidoRequest(id) {
  const response = await api.get(`/contenidos/${id}`);
  return response.data;
}

export async function editarContenidoRequest(id, datosContenido) {
  const response = await api.put(`/contenidos/${id}`, datosContenido);
  return response.data;
}

export async function eliminarContenidoRequest(id) {
  const response = await api.delete(`/contenidos/${id}`);
  return response.data;
}

export async function reordenarContenidoRequest(id, direccion) {
  const response = await api.put(`/contenidos/${id}/reordenar`, { direccion });
  return response.data;
}
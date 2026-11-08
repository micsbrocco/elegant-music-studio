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

// Mueve una clase a otro módulo (drag & drop entre módulos en el editor),
// opcionalmente fijando ya su posición dentro del módulo destino.
export async function moverContenidoRequest(id, idModulo, orden) {
  const response = await api.put(`/contenidos/${id}/mover`, { idModulo, orden });
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

export async function reordenarContenidosLoteRequest(idsOrdenados) {
  const response = await api.put('/contenidos/reordenar-lote', { ids: idsOrdenados });
  return response.data;
}

export async function subirArchivoLeccionRequest(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const response = await api.post('/contenidos/subir-archivo', formData);
  return response.data;
}

// Solo admin: pide una URL firmada temporal para previsualizar un archivo por su ruta interna
// (se usa en el editor, incluso antes de guardar la clase).
export async function firmarUrlArchivoAdminRequest(ruta) {
  const response = await api.post('/contenidos/firmar-url-admin', { ruta });
  return response.data;
}

// Admin o alumno inscripto: pide una URL firmada temporal para descargar un archivo ya guardado.
export async function obtenerUrlArchivoRequest(archivoId) {
  const response = await api.get(`/contenidos/archivos/${archivoId}/url`);
  return response.data;
}
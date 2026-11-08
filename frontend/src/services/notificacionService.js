import api from './api';

// grupo: ventas | gestion | preguntas (sin grupo: las últimas de todo)
export async function listarNotificacionesRequest(grupo) {
  const response = await api.get('/notificaciones', { params: grupo ? { grupo } : {} });
  return response.data;
}

export async function marcarNotificacionLeidaRequest(id) {
  const response = await api.patch(`/notificaciones/${id}/leida`);
  return response.data;
}

export async function marcarTodasLeidasRequest(grupo) {
  const response = await api.patch('/notificaciones/leidas', null, { params: grupo ? { grupo } : {} });
  return response.data;
}

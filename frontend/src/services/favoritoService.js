import api from './api';

export async function verFavoritosRequest() {
  const response = await api.get('/favoritos');
  return response.data;
}

export async function agregarFavoritoRequest(cursoId) {
  const response = await api.post('/favoritos', { cursoId });
  return response.data;
}

export async function quitarFavoritoRequest(id) {
  const response = await api.delete(`/favoritos/${id}`);
  return response.data;
}
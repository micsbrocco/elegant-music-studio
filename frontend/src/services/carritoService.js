import api from './api';

export async function verCarritoRequest() {
  const response = await api.get('/carrito');
  return response.data;
}

export async function agregarAlCarritoRequest(cursoId) {
  const response = await api.post('/carrito', { cursoId });
  return response.data;
}

export async function quitarDelCarritoRequest(id) {
  const response = await api.delete(`/carrito/${id}`);
  return response.data;
}

export async function comprarCarritoRequest() {
  const response = await api.post('/carrito/comprar');
  return response.data;
}
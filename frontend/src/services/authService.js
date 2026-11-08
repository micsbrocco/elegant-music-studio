import api from './api';

export async function loginRequest(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

export async function googleRequest(credential) {
  const response = await api.post('/auth/google', { credential });
  return response.data;
}

export async function registrarRequest(nombre, apellido, email, password) {
  const response = await api.post('/auth/registro', { nombre, apellido, email, password });
  return response.data;
}

export async function solicitarRecuperacionRequest(email) {
  const response = await api.post('/auth/recuperar-password', { email });
  return response.data;
}

export async function resetearPasswordRequest(token, nuevaPassword) {
  const response = await api.post('/auth/resetear-password', { token, nuevaPassword });
  return response.data;
}

export async function verificarEmailRequest(token) {
  const response = await api.get(`/auth/verificar-email?token=${token}`);
  return response.data;
}
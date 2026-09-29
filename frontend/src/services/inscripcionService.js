import api from './api';

export async function comprarCursoRequest(cursoId) {
  const response = await api.post('/inscripciones/comprar', { cursoId });
  return response.data;
}

export async function misCursosRequest() {
  const response = await api.get('/inscripciones/mis-cursos');
  return response.data;
}

export async function verificarInscripcionRequest(cursoId) {
  const response = await api.get(`/inscripciones/verificar/${cursoId}`);
  return response.data;
}
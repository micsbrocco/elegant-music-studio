import api from './api';

export async function obtenerLandingRequest() {
  const response = await api.get('/landing');
  return response.data;
}

export async function actualizarLandingRequest(contenido) {
  const response = await api.put('/landing', { contenido });
  return response.data;
}

export async function subirFotoLandingRequest(archivo) {
  const formData = new FormData();
  formData.append('foto', archivo);

  // No fijamos el header Content-Type a mano: si lo hacemos, el navegador no puede
  // agregar el "boundary" que multipart/form-data necesita y el backend no puede leer el archivo.
  const response = await api.post('/landing/foto', formData);
  return response.data;
}

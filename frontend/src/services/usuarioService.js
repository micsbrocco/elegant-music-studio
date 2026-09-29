import api from './api';

export async function obtenerPerfilRequest() {
  const response = await api.get('/usuarios/perfil');
  return response.data;
}

export async function editarPerfilRequest(datosPerfil) {
  const response = await api.put('/usuarios/perfil', datosPerfil);
  return response.data;
}

export async function subirFotoPerfilRequest(archivo) {
  const formData = new FormData();
  formData.append('foto', archivo);

  const response = await api.post('/usuarios/perfil/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
import api from './api';

export async function obtenerResumenRequest() {
  const response = await api.get('/reportes/resumen');
  return response.data;
}

export async function listarAlumnosRequest() {
  const response = await api.get('/reportes/alumnos');
  return response.data;
}

export async function listarVentasRequest() {
  const response = await api.get('/reportes/ventas');
  return response.data;
}

export async function descargarCsv(endpoint, nombreArchivo) {
  const response = await api.get(endpoint, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
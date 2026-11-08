import api from './api';

export async function obtenerResumenRequest() {
  const response = await api.get('/reportes/resumen');
  return response.data;
}

// Listados con filtros y paginación del lado del servidor.
// params: { desde, hasta, estado, curso, buscar, orden, pagina, porPagina }
export async function listarAlumnosRequest(params = {}) {
  const response = await api.get('/reportes/alumnos', { params });
  return response.data;
}

export async function reactivarAlumnoRequest(id) {
  const response = await api.patch(`/reportes/alumnos/${id}/reactivar`);
  return response.data;
}

export async function listarVentasRequest(params = {}) {
  const response = await api.get('/reportes/ventas', { params });
  return response.data;
}

export async function obtenerPrimeraVentaRequest() {
  const response = await api.get('/reportes/primera-venta');
  return response.data;
}

export async function listarCursosFiltroRequest() {
  const response = await api.get('/reportes/cursos-filtro');
  return response.data;
}

export async function obtenerVentasPeriodoRequest(periodo) {
  const response = await api.get(`/reportes/ventas-periodo?periodo=${periodo}`);
  return response.data;
}

// Descarga un Excel. Con params exporta solo lo filtrado (lo que se está viendo).
export async function descargarCsv(endpoint, nombreArchivo, params = {}) {
  const response = await api.get(endpoint, { responseType: 'blob', params });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Detalle del pago de una venta (número de operación, medio, comisión, neto)
export async function obtenerDetalleVentaRequest(id) {
  const response = await api.get(`/reportes/ventas/${id}/detalle`);
  return response.data;
}

// Cursos con la cantidad de alumnos (para la tarjeta "Alumnos por curso")
export async function listarCursosConAlumnosRequest() {
  const response = await api.get('/reportes/cursos-alumnos');
  return response.data;
}

// Alumnos de un curso con su avance. params: { progreso, buscar, orden, pagina, porPagina }
export async function listarAlumnosDeCursoRequest(idCurso, params = {}) {
  const response = await api.get(`/reportes/cursos/${idCurso}/alumnos`, { params });
  return response.data;
}

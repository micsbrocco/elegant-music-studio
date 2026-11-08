// Carrito para gente que todavía no inició sesión: vive en localStorage del
// navegador (solo un array de IDs de curso), no en la base de datos. Cuando
// el usuario inicia sesión, AuthContext se encarga de fusionarlo con su
// carrito real y vaciarlo de acá.
const CLAVE = 'carritoInvitado';

function leer() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    const ids = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

// Evento propio para que el navbar (u otro componente) se entere al toque
// de que el carrito de invitado cambió, sin esperar a recargar la página.
const EVENTO_CAMBIO = 'carrito-invitado-cambio';

function guardar(ids) {
  localStorage.setItem(CLAVE, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export function alCambiarCarritoInvitado(callback) {
  window.addEventListener(EVENTO_CAMBIO, callback);
  return () => window.removeEventListener(EVENTO_CAMBIO, callback);
}

export function obtenerCarritoInvitado() {
  return leer();
}

export function agregarAlCarritoInvitado(cursoId) {
  const ids = leer();
  const idNum = Number(cursoId);
  if (!ids.includes(idNum)) {
    guardar([...ids, idNum]);
  }
}

export function quitarDelCarritoInvitado(cursoId) {
  const idNum = Number(cursoId);
  guardar(leer().filter((id) => id !== idNum));
}

export function vaciarCarritoInvitado() {
  localStorage.removeItem(CLAVE);
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

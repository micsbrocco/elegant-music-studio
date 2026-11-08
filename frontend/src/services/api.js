import axios from 'axios';

// La API se llama siempre en la misma dirección que la página (/api):
// - en la compu, Vite la redirige a localhost:3001 (ver vite.config.js)
// - en Cloudflare Pages, la redirige a Render (ver functions/api/[[ruta]].js)
// Así la cookie de sesión es "del mismo sitio" y funciona en todos los navegadores.
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({ baseURL: API_URL, withCredentials: true });

// El token de acceso vive solo en memoria: no queda guardado en el navegador.
// Dura unos minutos; cuando vence se pide otro con la cookie de sesión (httpOnly).
let tokenAcceso = null;
export function guardarToken(token) {
  tokenAcceso = token || null;
}

// Una sola renovación a la vez, aunque fallen varios pedidos juntos
let renovando = null;
export function renovarSesion() {
  if (!renovando) {
    renovando = axios
      .post(`${API_URL}/auth/renovar`, null, { withCredentials: true, headers: { 'X-Sesion': '1' } })
      .then((r) => {
        guardarToken(r.data.token);
        return r.data; // { token, usuario }
      })
      .catch(() => {
        guardarToken(null);
        return null;
      })
      .finally(() => {
        renovando = null;
      });
  }
  return renovando;
}

export function cerrarSesionServidor() {
  guardarToken(null);
  return axios
    .post(`${API_URL}/auth/logout`, null, { withCredentials: true, headers: { 'X-Sesion': '1' } })
    .catch(() => {});
}

// Al abrir la página se recupera la sesión; los pedidos esperan a que termine
// para no salir "sin usuario" por llegar antes.
let arranque = null;
export function esperarArranque(promesa) {
  arranque = promesa;
}

api.interceptors.request.use(async (config) => {
  if (arranque) await arranque;
  if (tokenAcceso) {
    config.headers.Authorization = `Bearer ${tokenAcceso}`;
  }
  return config;
});

// Si el token de acceso venció, se renueva y se repite el pedido una vez.
// Si la sesión ya no es válida, se lleva a iniciar sesión con un aviso.
let redirigiendo = false;
api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const config = error.config;
    const llevabaToken = Boolean(config?.headers?.Authorization);
    if (error.response?.status !== 401 || !llevabaToken) {
      return Promise.reject(error);
    }

    if (!config._reintento) {
      config._reintento = true;
      const sesion = await renovarSesion();
      if (sesion) {
        config.headers.Authorization = `Bearer ${sesion.token}`;
        return api(config);
      }
    }

    if (!redirigiendo) {
      redirigiendo = true;
      guardarToken(null);
      try {
        sessionStorage.setItem('sesion-vencida', '1');
      } catch {
        // sin sessionStorage, se va igual al login (sin el aviso)
      }
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      } else {
        redirigiendo = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;

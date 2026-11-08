// Cloudflare Pages Function: todo lo que llega a /api/* se reenvía al backend
// en Render. Así la página y la API quedan en la misma dirección y la cookie
// de sesión (httpOnly) funciona en todos los navegadores, incluido Safari.
// En Cloudflare Pages hay que definir las variables:
// - API_ORIGEN: la dirección de Render (ej: https://elegant-api.onrender.com), sin /api
// - PROXY_SECRETO: la misma clave que en Render. Con ella el backend confía en la
//   IP del usuario que le pasamos (para los límites de intentos de login).
export async function onRequest({ request, env }) {
  const origen = (env.API_ORIGEN || '').replace(/\/$/, '');
  if (!origen) {
    return new Response(JSON.stringify({ error: 'Falta configurar API_ORIGEN' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const destino = `${origen}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('X-Forwarded-Host', url.host);
  // IP real del usuario (la pone Cloudflare; si el usuario manda una, se pisa)
  headers.set('X-Cliente-IP', request.headers.get('CF-Connecting-IP') || '');
  if (env.PROXY_SECRETO) headers.set('X-Proxy-Secreto', env.PROXY_SECRETO);
  else headers.delete('X-Proxy-Secreto');

  return fetch(destino, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  });
}

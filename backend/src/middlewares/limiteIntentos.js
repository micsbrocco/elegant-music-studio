const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Límites de intentos para frenar a quien prueba contraseñas a lo bruto.
// Se cuentan en la memoria del servidor (alcanza con un solo servidor, como en Render).

// La IP real del usuario. Los pedidos llegan a través de Cloudflare, que la manda
// en X-Cliente-IP junto con una clave que solo conocen Cloudflare y el backend
// (PROXY_SECRETO): así nadie puede inventar su IP llamando directo a Render.
function ipCliente(req) {
  const secreto = process.env.PROXY_SECRETO;
  if (secreto && req.headers['x-proxy-secreto'] === secreto && req.headers['x-cliente-ip']) {
    return String(req.headers['x-cliente-ip']);
  }
  return req.ip;
}

function responderLimite(req, res) {
  const minutos = Math.max(1, Math.ceil((req.rateLimit.resetTime - Date.now()) / 60000));
  res.status(429).json({
    error: `Demasiados intentos. Probá de nuevo en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
    codigo: 'DEMASIADOS_INTENTOS',
  });
}

const comun = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: responderLimite,
};

const porIp = (req) => ipKeyGenerator(ipCliente(req));

// Por cuenta: 5 contraseñas mal en 15 minutos bloquean ESA cuenta un rato,
// aunque prueben desde muchas IPs distintas. Los ingresos correctos no cuentan.
const limiteLoginPorCuenta = rateLimit({
  ...comun,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `cuenta:${String(req.body?.email || '').trim().toLowerCase()}`,
});

// Por IP: generoso, porque en una facultad muchos comparten la misma conexión
const limiteLoginPorIp = rateLimit({
  ...comun,
  windowMs: 15 * 60 * 1000,
  limit: 50,
  skipSuccessfulRequests: true,
  keyGenerator: porIp,
});

// Registro y mails de recuperación: evita que se usen para mandar spam
const limiteEnvioMails = rateLimit({
  ...comun,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: porIp,
});

// Botón de arrepentimiento (público, manda un mail con el código)
const limiteArrepentimiento = rateLimit({
  ...comun,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: porIp,
});

// Probar códigos de recuperación de contraseña
const limiteCodigos = rateLimit({
  ...comun,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  keyGenerator: porIp,
});

// Verificación pública de certificados: evita que prueben códigos en masa
const limiteVerificacion = rateLimit({
  ...comun,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: porIp,
});

module.exports = { limiteLoginPorCuenta, limiteLoginPorIp, limiteEnvioMails, limiteArrepentimiento, limiteCodigos, limiteVerificacion };

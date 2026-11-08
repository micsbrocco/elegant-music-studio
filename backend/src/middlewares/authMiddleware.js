const jwt = require('jsonwebtoken');
const { registrarActividad } = require('../utils/actividad');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó un token' });
  }

  // El header viene como "Bearer eyJhbGci..."
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // guardamos { id, rol } para usarlo en el controller
    // Cualquier uso de la plataforma con la sesión iniciada cuenta como actividad
    // (ver clases, comprar, editar el perfil...). Se registra sin demorar la respuesta.
    registrarActividad(payload.id);
    next(); // deja pasar la petición al controller
  } catch (error) {
    // 401 (no 403): el frontend lo toma como "la sesión venció" y manda a iniciar sesión
    return res.status(401).json({ error: 'Tu sesión venció. Volvé a iniciar sesión.', codigo: 'SESION_VENCIDA' });
  }
}

// Igual que verificarToken, pero nunca corta la petición: si hay un token
// válido lo decodifica y lo deja en req.usuario, y si no hay token (o es
// inválido) simplemente sigue sin usuario. Útil para rutas públicas que
// quieren dar información extra cuando el que pregunta está logueado.
function verificarTokenOpcional(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Token inválido/expirado: seguimos como si no hubiera usuario
  }
  next();
}

function verificarAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
}

// Deja pasar a administradores y a instructores (rol "profesor"). El control
// fino de QUÉ curso puede tocar cada instructor se hace dentro de cada
// controller (ver utils/permisosCurso.js), porque depende de a quién
// pertenece el curso puntual, algo que este middleware no puede saber.
function verificarAdminOInstructor(req, res, next) {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'profesor') {
    return res.status(403).json({ error: 'Acceso solo para administradores o instructores' });
  }
  next();
}

// Las compras "simuladas" (sin cobrar) son solo para demos y desarrollo. Quedan
// apagadas salvo que se active a propósito PERMITIR_COMPRA_SIMULADA=true en el
// .env, y nunca funcionan si NODE_ENV es "production".
function soloSiCompraSimuladaHabilitada(req, res, next) {
  const habilitada = process.env.PERMITIR_COMPRA_SIMULADA === 'true'
    && process.env.NODE_ENV !== 'production';
  if (!habilitada) {
    return res.status(403).json({ error: 'La compra simulada está deshabilitada. Pagá con Mercado Pago.' });
  }
  next();
}

module.exports = { soloSiCompraSimuladaHabilitada, verificarToken, verificarTokenOpcional, verificarAdmin, verificarAdminOInstructor };

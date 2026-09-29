const jwt = require('jsonwebtoken');

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
    next(); // deja pasar la petición al controller
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

function verificarAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
}

module.exports = { verificarToken, verificarAdmin };
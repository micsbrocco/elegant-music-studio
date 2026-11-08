const prisma = require('../config/prisma');

// Registra que un usuario usó la plataforma (inició sesión, vio una clase,
// compró, etc.). Para no escribir en la base en cada petición, se guarda como
// mucho una vez cada 6 horas por usuario. Si estaba inactivo, vuelve a activo.
const INTERVALO_MS = 6 * 60 * 60 * 1000;
const ultimoRegistro = new Map(); // idUsuario -> timestamp (en memoria del proceso)

function registrarActividad(idUsuario, { forzar = false } = {}) {
  if (!idUsuario) return;
  const ahora = Date.now();
  const anterior = ultimoRegistro.get(idUsuario);
  if (!forzar && anterior && ahora - anterior < INTERVALO_MS) return;
  ultimoRegistro.set(idUsuario, ahora);

  // Sin await: no demora la respuesta al usuario. Si falla, solo se loguea.
  prisma.usuario
    .update({ where: { id: idUsuario }, data: { ultimaActividad: new Date(ahora), activo: true } })
    .catch((error) => {
      ultimoRegistro.delete(idUsuario);
      console.error('No se pudo registrar la actividad del usuario', idUsuario, error.message);
    });
}

module.exports = { registrarActividad };

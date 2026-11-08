const prisma = require('../config/prisma');
const { enviarEmail, plantillaEmail } = require('../config/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Lo que escriben los usuarios (nombres, preguntas) va dentro de mails en HTML
function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function idsAdmins() {
  const admins = await prisma.usuario.findMany({ where: { rol: 'admin' }, select: { id: true } });
  return admins.map((a) => a.id);
}

// Crea el aviso de la campana para cada destinatario y, si se pide, manda un mail.
//   para: 'admins' o una lista de ids de usuario
//   email: { a: 'avisos' | email, asunto, parrafos, textoBoton } (opcional)
// Nunca hace fallar la operación que lo llamó: si algo falla, solo lo registra.
async function notificar({ para, tipo, titulo, mensaje = null, enlace = null, email = null }) {
  try {
    const destinatarios = para === 'admins' ? await idsAdmins() : [...new Set(para)].filter(Boolean);
    if (destinatarios.length > 0) {
      await prisma.notificacion.createMany({
        data: destinatarios.map((idUsuario) => ({ idUsuario, tipo, titulo, mensaje, enlace })),
      });
    }

    if (email) {
      // 'avisos': el mail del estudio (EMAIL_AVISOS o, si no está, la cuenta que envía)
      const to = email.a === 'avisos' ? (process.env.EMAIL_AVISOS || process.env.EMAIL_USER) : email.a;
      if (to) {
        await enviarEmail({
          to,
          subject: email.asunto,
          html: plantillaEmail({
            titulo: email.titulo || titulo,
            parrafos: email.parrafos,
            textoBoton: enlace ? (email.textoBoton || 'Ver en el panel') : undefined,
            urlBoton: enlace ? `${FRONTEND_URL}${enlace}` : undefined,
          }),
        });
      }
    }
  } catch (error) {
    console.error(`Notificación "${tipo}" no enviada:`, error.message);
  }
}

module.exports = { notificar, escapar, idsAdmins };

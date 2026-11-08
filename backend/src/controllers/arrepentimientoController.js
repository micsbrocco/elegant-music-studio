const crypto = require('crypto');
const prisma = require('../config/prisma');
const { enviarEmail, plantillaEmail } = require('../config/email');
const { avanceDeInscripcion, evaluarPolitica, DIAS_ARREPENTIMIENTO, AVANCE_MAXIMO } = require('../utils/politicaArrepentimiento');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');
const { notificar } = require('../utils/notificar');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const UN_DIA_MS = 24 * 60 * 60 * 1000;

// Lo que escribe la persona va dentro de un email en HTML: se escapa siempre
function escapar(texto) {
  return String(texto || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Código corto y fácil de dictar: ARR-7K3QXM (sin 0/O ni 1/I para no confundir)
function generarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  return `ARR-${Array.from(bytes, (b) => letras[b % letras.length]).join('')}`;
}

// Freno simple contra envíos masivos: hasta 5 pedidos por hora desde la misma IP
const enviosPorIp = new Map();
function superaLimite(ip) {
  const ahora = Date.now();
  const recientes = (enviosPorIp.get(ip) || []).filter((t) => ahora - t < 60 * 60 * 1000);
  recientes.push(ahora);
  enviosPorIp.set(ip, recientes);
  return recientes.length > 5;
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/arrepentimiento (público, sin iniciar sesión)
async function crearSolicitud(req, res) {
  try {
    const nombre = String(req.body.nombre || '').trim().slice(0, 120);
    const email = String(req.body.email || '').trim().toLowerCase().slice(0, 160);
    const referencia = String(req.body.referencia || '').trim().slice(0, 200) || null;
    const motivo = String(req.body.motivo || '').trim().slice(0, 1000) || null;

    if (!nombre || !EMAIL_VALIDO.test(email)) {
      return res.status(400).json({ error: 'Completá tu nombre y un email válido' });
    }
    if (superaLimite(req.ip)) {
      return res.status(429).json({ error: 'Hiciste demasiados pedidos seguidos. Probá de nuevo en un rato.' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });

    let solicitud;
    for (let intento = 0; intento < 3 && !solicitud; intento += 1) {
      try {
        solicitud = await prisma.solicitudArrepentimiento.create({
          data: { codigo: generarCodigo(), nombre, email, referencia, motivo, idUsuario: usuario?.id ?? null },
        });
      } catch (error) {
        if (error.code !== 'P2002') throw error; // código repetido: se genera otro
      }
    }

    // Comprobante para la persona y aviso al estudio. Si el mail falla, el pedido
    // igual queda registrado (y el código se muestra en pantalla).
    const avisos = [
      enviarEmail({
        to: email,
        subject: `Recibimos tu solicitud de arrepentimiento (${solicitud.codigo})`,
        html: plantillaEmail({
          titulo: 'Recibimos tu solicitud',
          parrafos: [
            `Hola ${escapar(nombre)}, registramos tu pedido de arrepentimiento de compra.`,
            `Tu código de solicitud es <strong style="color:#ffffff;">${solicitud.codigo}</strong>. Guardalo: lo vas a necesitar si nos consultás por este pedido.`,
            referencia ? `Indicaste: ${escapar(referencia)}.` : 'Si compraste más de un curso, respondé este mail indicando cuál.',
            'Vamos a revisar tu compra y te vamos a responder a este mismo email.',
          ],
          notaFinal: `Podés arrepentirte dentro de los ${DIAS_ARREPENTIMIENTO} días corridos desde la compra. La devolución se hace al mismo medio con el que pagaste.`,
        }),
      }),
      enviarEmail({
        to: process.env.EMAIL_AVISOS || process.env.EMAIL_USER,
        subject: `Nueva solicitud de arrepentimiento: ${solicitud.codigo}`,
        html: plantillaEmail({
          titulo: 'Nueva solicitud de arrepentimiento',
          parrafos: [
            `<strong style="color:#ffffff;">${escapar(nombre)}</strong> (${escapar(email)}) pidió arrepentirse de una compra.`,
            referencia ? `Curso u operación: ${escapar(referencia)}` : 'No indicó curso ni operación.',
            motivo ? `Motivo: ${escapar(motivo)}` : 'No indicó motivo.',
            usuario ? 'El email coincide con una cuenta de la plataforma.' : 'El email no coincide con ninguna cuenta.',
          ],
          textoBoton: 'Ver en el panel',
          urlBoton: `${FRONTEND_URL}/admin/ventas`,
          notaFinal: 'La ley pide confirmarle a la persona dentro de las 24 horas: el comprobante con el código ya se le envió automáticamente.',
        }),
      }),
    ];
    // En la campana del panel (el mail al estudio ya va arriba)
    avisos.push(notificar({
      para: 'admins',
      tipo: 'arrepentimiento',
      titulo: 'Nueva solicitud de arrepentimiento',
      mensaje: `${nombre}${referencia ? ` · ${referencia}` : ''}`,
      enlace: '/admin/ventas?pestana=arrepentimientos',
    }));
    const resultados = await Promise.allSettled(avisos);
    resultados.forEach((r) => { if (r.status === 'rejected') console.error('Arrepentimiento: no se pudo enviar un email', r.reason?.message); });

    res.status(201).json({ codigo: solicitud.codigo, emailEnviado: resultados[0].status === 'fulfilled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No pudimos registrar tu solicitud. Probá de nuevo o escribinos por email.' });
  }
}

// Compras recientes de quien pidió el arrepentimiento, con su avance y si
// entran en la política, para decidir sin tener que buscar en otro lado
async function comprasRecientes(solicitud) {
  const usuario = solicitud.idUsuario
    ? { id: solicitud.idUsuario }
    : await prisma.usuario.findUnique({ where: { email: solicitud.email }, select: { id: true } });
  if (!usuario) return [];

  const desde = new Date(new Date(solicitud.creadaEn).getTime() - 60 * UN_DIA_MS);
  const inscripciones = await prisma.inscripcion.findMany({
    where: {
      idUsuario: usuario.id,
      esVistaPrevia: false,
      ...INSCRIPCION_VIGENTE,
      pago: { is: { fechaPago: { gte: desde } } },
    },
    select: {
      id: true,
      curso: { select: { id: true, titulo: true } },
      pago: { select: { id: true, monto: true, fechaPago: true, idTransaccionExterna: true } },
    },
    orderBy: { fechaInscripcion: 'desc' },
    take: 5,
  });

  return Promise.all(inscripciones.map(async (i) => {
    const avance = await avanceDeInscripcion(i.id, i.curso.id);
    return {
      idVenta: i.pago.id,
      curso: i.curso.titulo,
      monto: i.pago.monto,
      fecha: i.pago.fechaPago,
      numeroOperacion: i.pago.idTransaccionExterna,
      avance,
      politica: evaluarPolitica(i.pago.fechaPago, avance.porcentaje),
    };
  }));
}

const ESTADOS_SOLICITUD = ['pendiente', 'aceptada', 'rechazada'];

// GET /api/arrepentimiento?vista=pendientes|historial&pagina= (admin)
//  - pendientes: las que esperan respuesta, de la más vieja a la más nueva
//  - historial: las ya aceptadas o rechazadas, de la última resuelta hacia atrás
async function listarSolicitudes(req, res) {
  try {
    // ?soloConteo=1: solo cuántas hay pendientes (para el contador)
    if (req.query.soloConteo === '1') {
      const pendientes = await prisma.solicitudArrepentimiento.count({ where: { estado: 'pendiente' } });
      return res.json({ pendientes });
    }
    const historial = req.query.vista === 'historial';
    const where = historial ? { estado: { in: ['aceptada', 'rechazada'] } } : { estado: 'pendiente' };
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const porPagina = 5;
    const [items, total, pendientes] = await Promise.all([
      prisma.solicitudArrepentimiento.findMany({
        where,
        orderBy: historial ? { resueltaEn: 'desc' } : { creadaEn: 'asc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.solicitudArrepentimiento.count({ where }),
      prisma.solicitudArrepentimiento.count({ where: { estado: 'pendiente' } }),
    ]);
    // Las compras con su avance solo hacen falta para decidir (pendientes)
    const conCompras = await Promise.all(items.map(async (s) => ({
      ...s,
      compras: historial ? [] : await comprasRecientes(s),
    })));
    res.json({
      items: conCompras,
      total,
      pagina,
      porPagina,
      pendientes,
      politica: { diasLimite: DIAS_ARREPENTIMIENTO, avanceMaximo: AVANCE_MAXIMO },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar las solicitudes de arrepentimiento' });
  }
}

// PATCH /api/arrepentimiento/:id { estado: 'aceptada' | 'rechazada' | 'pendiente' } (admin)
async function cambiarEstadoSolicitud(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body;
    if (!ESTADOS_SOLICITUD.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const solicitud = await prisma.solicitudArrepentimiento.update({
      where: { id },
      data: { estado, resueltaEn: estado === 'pendiente' ? null : new Date() },
    });
    res.json(solicitud);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Solicitud no encontrada' });
    console.error(error);
    res.status(500).json({ error: 'No se pudo actualizar la solicitud' });
  }
}

// GET /api/arrepentimiento/politica (público): para mostrar los plazos en la página
function obtenerPolitica(req, res) {
  res.json({ diasLimite: DIAS_ARREPENTIMIENTO, avanceMaximo: AVANCE_MAXIMO });
}

module.exports = { crearSolicitud, listarSolicitudes, cambiarEstadoSolicitud, obtenerPolitica };

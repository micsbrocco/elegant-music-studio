const prisma = require('../config/prisma');
const { cliente, Preference, Payment } = require('../config/mercadopago');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');
const { firmaValida } = require('../utils/firmaMercadoPago');
const { avisarVenta } = require('../utils/avisoVenta');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function crearPreferencia(req, res) {
  try {
    const idUsuario = req.usuario.id;
    const { cursoIds } = req.body;

    if (!Array.isArray(cursoIds) || cursoIds.length === 0) {
      return res.status(400).json({ error: 'Tenés que indicar al menos un curso' });
    }

    const ids = cursoIds.map((id) => parseInt(id));

    // Los precios y títulos salen de la bdd
    const cursos = await prisma.curso.findMany({
      where: { id: { in: ids }, estado: 'activo' },
    });
    if (cursos.length !== ids.length) {
      return res.status(404).json({ error: 'Alguno de los cursos no está disponible' });
    }

    const yaInscriptos = await prisma.inscripcion.findMany({
      where: { idUsuario, idCurso: { in: ids }, ...INSCRIPCION_VIGENTE },
    });
    if (yaInscriptos.length > 0) {
      return res.status(409).json({ error: 'Ya estás inscripto en alguno de estos cursos' });
    }

    const body = {
      items: cursos.map((c) => ({
        id: String(c.id),
        title: c.titulo,
        quantity: 1,
        unit_price: Number(c.precio),
        currency_id: 'ARS',
      })),
      // Formato: "idUsuario|idCurso1,idCurso2". El webhook lo va a leer
      external_reference: `${idUsuario}|${ids.join(',')}`,
      back_urls: {
        success: `${FRONTEND_URL}/pago/exito`,
        failure: `${FRONTEND_URL}/pago/error`,
        pending: `${FRONTEND_URL}/pago/pendiente`,
      },
    };

    if (process.env.MP_NOTIFICATION_URL) {
      body.notification_url = process.env.MP_NOTIFICATION_URL;
    }
    // Con el sitio publicado (https), Mercado Pago vuelve solo a la página de
    // éxito apenas se aprueba el pago. En localhost no lo permite.
    if (FRONTEND_URL.startsWith('https://')) {
      body.auto_return = 'approved';
    }

    const preferencia = await new Preference(cliente).create({ body });

    res.json({ initPoint: preferencia.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }
}

// Lo que informa Mercado Pago sobre la plata de una operación
function datosOperacion(pago) {
  const total = Number(pago.transaction_amount || 0);
  // Comisiones que paga el vendedor (Mercado Pago, financiación, etc.)
  const comision = (pago.fee_details || [])
    .filter((f) => !f.fee_payer || f.fee_payer === 'collector')
    .reduce((suma, f) => suma + Number(f.amount || 0), 0);
  const netoInformado = pago.transaction_details?.net_received_amount;
  return {
    montoTotal: total,
    comision,
    neto: netoInformado != null ? Number(netoInformado) : total - comision,
    montoReembolsado: Number(pago.transaction_amount_refunded || 0),
    medioPago: pago.payment_method_id || null,
    tipoMedio: pago.payment_type_id || null,
    cuotas: pago.installments || null,
    fechaAcreditacion: pago.money_release_date ? new Date(pago.money_release_date) : null,
  };
}

// Pago aprobado: inscribe al alumno en los cursos y guarda la operación
async function registrarPagoAprobado(pago) {
  const idExterno = String(pago.id);

  // Mercado Pago puede avisar varias veces del mismo pago
  const yaProcesado = await prisma.operacionPago.findUnique({ where: { idExterno } });
  if (yaProcesado) {
    // Solo se actualizan los datos de la plata (por ej. un reembolso parcial)
    await prisma.operacionPago.update({ where: { idExterno }, data: datosOperacion(pago) });
    return;
  }

  // external_reference tiene el formato "idUsuario|idCurso1,idCurso2"
  const [textoUsuario, textoCursos] = String(pago.external_reference || '').split('|');
  const idUsuario = parseInt(textoUsuario);
  const idsCursos = (textoCursos || '')
    .split(',')
    .map((id) => parseInt(id))
    .filter((id) => !Number.isNaN(id));

  if (Number.isNaN(idUsuario) || idsCursos.length === 0) {
    console.error('Webhook MP: external_reference inválida', pago.external_reference);
    return;
  }

  const cursos = await prisma.curso.findMany({ where: { id: { in: idsCursos } } });
  // Precio que efectivamente se cobró por cada curso (el de la preferencia)
  const precioCobrado = {};
  (pago.additional_info?.items || []).forEach((item) => {
    precioCobrado[parseInt(item.id)] = Number(item.unit_price);
  });

  // Todo junto o nada: si algo falla, no queda una compra a medias
  const idsPagos = [];
  try {
    await prisma.$transaction(async (tx) => {
      await tx.operacionPago.create({
        data: {
          idExterno,
          idUsuario,
          estado: 'aprobado',
          fechaAprobacion: pago.date_approved ? new Date(pago.date_approved) : new Date(),
          ...datosOperacion(pago),
        },
      });

      for (const curso of cursos) {
        const yaInscripto = await tx.inscripcion.findFirst({
          where: { idUsuario, idCurso: curso.id, ...INSCRIPCION_VIGENTE },
        });
        if (yaInscripto) continue;

        const inscripcion = await tx.inscripcion.create({
          data: { idUsuario, idCurso: curso.id },
        });

        const nuevoPago = await tx.pago.create({
          data: {
            idInscripcion: inscripcion.id,
            monto: precioCobrado[curso.id] ?? curso.precio,
            estado: 'aprobado',
            metodo: 'mercadopago',
            idTransaccionExterna: idExterno,
          },
        });
        idsPagos.push(nuevoPago.id);
      }

      // Los cursos que ya se pagaron salen del carrito
      await tx.carritoItem.deleteMany({
        where: { idUsuario, idCurso: { in: idsCursos } },
      });
    });
  } catch (error) {
    // El webhook y la página de éxito pueden llegar al mismo tiempo: si el otro
    // ya registró la operación, no hay nada más que hacer.
    if (error.code === 'P2002') return;
    throw error;
  }

  // Aviso al admin (campana + mail), fuera de la transacción
  await avisarVenta(idUsuario, idsPagos);
}

// Reembolso o contracargo: la operación cambia de estado y el alumno pierde el
// acceso a esos cursos (la inscripción queda, pero ya no es "vigente").
async function revertirPago(pago, estado) {
  const idExterno = String(pago.id);
  const operacion = await prisma.operacionPago.findUnique({ where: { idExterno } });
  if (!operacion) return; // Nunca se aprobó en el sistema: no hay nada que revertir

  await prisma.$transaction([
    prisma.operacionPago.update({ where: { idExterno }, data: { estado, ...datosOperacion(pago) } }),
    prisma.pago.updateMany({ where: { idTransaccionExterna: idExterno }, data: { estado } }),
  ]);
}

const ESTADOS_REVERTIDOS = { refunded: 'reembolsado', charged_back: 'contracargo' };

// Webhook: Mercado Pago llama acá cuando cambia el estado de un pago.
// No lleva verificarToken porque quien llama es Mercado Pago, no un alumno.
async function recibirWebhook(req, res) {
  try {
    // Mercado Pago avisa en el body (JSON) o en la URL (?type=...&data.id=...)
    const tipo = req.body?.type || req.query.type || req.query.topic;
    const paymentId = req.query['data.id'] || req.body?.data?.id || req.query.id;

    // Solo nos interesan los avisos de pagos
    if (tipo !== 'payment' || !paymentId) {
      return res.sendStatus(200);
    }

    // El aviso tiene que venir firmado por Mercado Pago
    if (!firmaValida(req, paymentId)) {
      console.warn('Webhook MP: firma inválida, se ignora el aviso');
      return res.sendStatus(401);
    }

    // No confiamos en lo que dice el aviso: le preguntamos a Mercado Pago el estado real
    const pago = await new Payment(cliente).get({ id: paymentId });

    if (pago.status === 'approved') {
      await registrarPagoAprobado(pago);
    } else if (ESTADOS_REVERTIDOS[pago.status]) {
      await revertirPago(pago, ESTADOS_REVERTIDOS[pago.status]);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook MP:', error);
    res.sendStatus(500); // Mercado Pago reintenta más tarde
  }
}

// La página de éxito llama acá con el número de pago que Mercado Pago agrega a
// la URL de vuelta. Así el alumno tiene el curso al instante, sin esperar al
// webhook (que igual llega y no duplica nada).
async function confirmarPago(req, res) {
  try {
    const paymentId = String(req.body?.paymentId || '').trim();
    if (!/^\d+$/.test(paymentId)) {
      return res.status(400).json({ error: 'Número de pago inválido' });
    }

    // Preguntamos a Mercado Pago el estado real; no confiamos en la URL
    let pago;
    try {
      pago = await new Payment(cliente).get({ id: paymentId });
    } catch {
      return res.status(404).json({ error: 'No encontramos ese pago' });
    }

    // Solo el que hizo la compra puede confirmarla
    const [textoUsuario, textoCursos] = String(pago.external_reference || '').split('|');
    if (parseInt(textoUsuario) !== req.usuario.id) {
      return res.status(403).json({ error: 'Este pago no es tuyo' });
    }

    if (pago.status === 'approved') {
      await registrarPagoAprobado(pago);
    }

    const idsCursos = (textoCursos || '').split(',').map((id) => parseInt(id)).filter((id) => !Number.isNaN(id));
    res.json({ estado: pago.status, idsCursos });
  } catch (error) {
    console.error('Confirmar pago:', error);
    res.status(500).json({ error: 'No se pudo confirmar el pago' });
  }
}

// Historial de compras del usuario logueado (solo sus propios pagos).
async function misCompras(req, res) {
  try {
    const pagos = await prisma.pago.findMany({
      where: { inscripcion: { idUsuario: req.usuario.id } },
      orderBy: { fechaPago: 'desc' },
      select: {
        id: true,
        monto: true,
        estado: true,
        metodo: true,
        fechaPago: true,
        idTransaccionExterna: true,
        inscripcion: {
          select: {
            curso: { select: { id: true, titulo: true, categoria: true, imagenPortada: true } },
          },
        },
      },
    });

    res.json(
      pagos.map((p) => ({
        id: p.id,
        monto: p.monto,
        estado: p.estado,
        metodo: p.metodo,
        fechaPago: p.fechaPago,
        idTransaccionExterna: p.idTransaccionExterna,
        curso: p.inscripcion.curso,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron cargar tus compras' });
  }
}

module.exports = { crearPreferencia, recibirWebhook, confirmarPago, misCompras };
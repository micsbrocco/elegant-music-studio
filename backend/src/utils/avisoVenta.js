const prisma = require('../config/prisma');
const { notificar, escapar } = require('./notificar');

function pesos(valor) {
  return `$${Number(valor).toLocaleString('es-AR')}`;
}

// Aviso al admin de una compra (campana + mail). Un solo aviso por compra,
// aunque el alumno haya llevado varios cursos juntos.
//   idUsuario: quién compró · idsPagos: los Pago que se crearon en esa compra
async function avisarVenta(idUsuario, idsPagos) {
  if (!idsPagos || idsPagos.length === 0) return;
  const [alumno, pagos] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: idUsuario }, select: { nombre: true, apellido: true, email: true } }),
    prisma.pago.findMany({
      where: { id: { in: idsPagos } },
      select: { id: true, monto: true, inscripcion: { select: { curso: { select: { titulo: true } } } } },
    }),
  ]);
  if (!alumno || pagos.length === 0) return;

  const nombre = `${alumno.nombre} ${alumno.apellido}`;
  const total = pagos.reduce((suma, p) => suma + Number(p.monto), 0);
  const cursos = pagos.map((p) => p.inscripcion.curso.titulo);
  const textoCursos = cursos.length === 1 ? `"${cursos[0]}"` : `${cursos.length} cursos`;

  await notificar({
    para: 'admins',
    tipo: 'venta',
    titulo: `Nueva venta: ${pesos(total)}`,
    mensaje: `${nombre} compró ${textoCursos}`,
    enlace: `/admin/ventas?venta=${pagos[0].id}`,
    email: {
      a: 'avisos',
      asunto: `Nueva venta: ${cursos.length === 1 ? cursos[0] : `${cursos.length} cursos`} (${pesos(total)})`,
      titulo: '¡Nueva venta!',
      parrafos: [
        `<strong style="color:#ffffff;">${escapar(nombre)}</strong> (${escapar(alumno.email)}) compró:`,
        cursos.map((c, i) => `${escapar(c)} · ${pesos(pagos[i].monto)}`).join('<br>'),
        `Total: <strong style="color:#ffffff;">${pesos(total)}</strong>`,
      ],
      textoBoton: 'Ver la venta',
    },
  });
}

module.exports = { avisarVenta };

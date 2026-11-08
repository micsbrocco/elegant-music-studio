const prisma = require('../config/prisma');

// Política de arrepentimiento del sitio (la decide el dueño; se cambia por .env)
//  - plazo: días corridos desde la compra (la ley pide 10 como mínimo)
//  - avance máximo: si el alumno ya vio más que esto del curso, el contenido se
//    considera consumido y la devolución queda a criterio del vendedor
const DIAS_ARREPENTIMIENTO = parseInt(process.env.POLITICA_DIAS_ARREPENTIMIENTO, 10) || 10;
const AVANCE_MAXIMO = parseInt(process.env.POLITICA_AVANCE_MAXIMO, 10) || 20;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

// Cuántas clases (visibles) completó el alumno en ese curso
async function avanceDeInscripcion(idInscripcion, idCurso) {
  const [total, completadas] = await Promise.all([
    prisma.contenido.count({ where: { visible: true, modulo: { idCurso } } }),
    prisma.progreso.count({ where: { idInscripcion, completado: true, contenido: { visible: true } } }),
  ]);
  return {
    total,
    completadas,
    porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0,
  };
}

function evaluarPolitica(fechaCompra, porcentajeAvance) {
  const transcurrido = Date.now() - new Date(fechaCompra).getTime();
  const diasDesdeCompra = Math.floor(transcurrido / UN_DIA_MS);
  const motivos = [];
  if (transcurrido > DIAS_ARREPENTIMIENTO * UN_DIA_MS) motivos.push(`pasaron más de ${DIAS_ARREPENTIMIENTO} días`);
  if (porcentajeAvance > AVANCE_MAXIMO) motivos.push(`vio más del ${AVANCE_MAXIMO}% del curso`);
  return {
    dentro: motivos.length === 0,
    diasDesdeCompra,
    diasRestantes: Math.max(0, DIAS_ARREPENTIMIENTO - diasDesdeCompra),
    motivos,
    diasLimite: DIAS_ARREPENTIMIENTO,
    avanceMaximo: AVANCE_MAXIMO,
  };
}

module.exports = { avanceDeInscripcion, evaluarPolitica, DIAS_ARREPENTIMIENTO, AVANCE_MAXIMO };

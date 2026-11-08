const prisma = require('../config/prisma');

// Borra un curso y todo lo que cuelga de él. Solo lo usa la tarea automática,
// y solo para cursos archivados SIN ventas reales (las inscripciones que puede
// tener son de "vista previa" del admin o del instructor).
async function borrarCursoDefinitivo(idCurso) {
  const contenidos = await prisma.contenido.findMany({
    where: { modulo: { idCurso } },
    select: { id: true },
  });
  const idsContenidos = contenidos.map((c) => c.id);
  const inscripciones = await prisma.inscripcion.findMany({ where: { idCurso }, select: { id: true } });
  const idsInscripciones = inscripciones.map((i) => i.id);

  await prisma.$transaction([
    prisma.respuestaPregunta.deleteMany({ where: { pregunta: { bloque: { idContenido: { in: idsContenidos } } } } }),
    prisma.certificado.deleteMany({ where: { idInscripcion: { in: idsInscripciones } } }),
    prisma.pago.deleteMany({ where: { idInscripcion: { in: idsInscripciones } } }),
    prisma.progreso.deleteMany({ where: { idInscripcion: { in: idsInscripciones } } }),
    prisma.inscripcion.deleteMany({ where: { id: { in: idsInscripciones } } }),
    prisma.carritoItem.deleteMany({ where: { idCurso } }),
    prisma.favorito.deleteMany({ where: { idCurso } }),
    // Bloques, preguntas, archivos y progresos de cada clase se borran en cascada
    prisma.contenido.deleteMany({ where: { id: { in: idsContenidos } } }),
    prisma.modulo.deleteMany({ where: { idCurso } }),
    // Los colaboradores del curso se borran en cascada
    prisma.curso.delete({ where: { id: idCurso } }),
  ]);
}

module.exports = { borrarCursoDefinitivo };

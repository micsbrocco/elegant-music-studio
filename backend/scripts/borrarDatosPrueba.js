/* ============================================================
 * Borra los DATOS DE PRUEBA que cargó scripts/cargarDatosPrueba.js:
 * usuarios con email @prueba.elegant.com y los cursos que crearon,
 * con todo lo que cuelga de ellos. No toca nada más.
 *
 * Uso (desde la carpeta backend):   node scripts/borrarDatosPrueba.js
 * ============================================================ */
require('dotenv').config();
const prisma = require('../src/config/prisma');

const DOMINIO = '@prueba.elegant.com';

async function main() {
  const usuarios = await prisma.usuario.findMany({ where: { email: { endsWith: DOMINIO } }, select: { id: true } });
  const idsUsuarios = usuarios.map((u) => u.id);
  if (idsUsuarios.length === 0) {
    console.log('No hay datos de prueba para borrar.');
    return;
  }
  const cursos = await prisma.curso.findMany({ where: { idAdminCreador: { in: idsUsuarios } }, select: { id: true } });
  const idsCursos = cursos.map((c) => c.id);

  // Inscripciones de los alumnos de prueba y también las que haya en los cursos de prueba
  const inscripciones = await prisma.inscripcion.findMany({
    where: { OR: [{ idUsuario: { in: idsUsuarios } }, { idCurso: { in: idsCursos } }] },
    select: { id: true },
  });
  const idsInscripciones = inscripciones.map((i) => i.id);
  const contenidos = await prisma.contenido.findMany({ where: { modulo: { idCurso: { in: idsCursos } } }, select: { id: true } });
  const idsContenidos = contenidos.map((c) => c.id);

  await prisma.$transaction([
    // Las filas del registro de instructores de los usuarios de prueba
    prisma.historialInstructor.deleteMany({ where: { OR: [{ idUsuario: { in: idsUsuarios } }, { email: { endsWith: DOMINIO } }] } }),
    prisma.respuestaPregunta.deleteMany({
      where: { OR: [{ idUsuario: { in: idsUsuarios } }, { pregunta: { bloque: { idContenido: { in: idsContenidos } } } }] },
    }),
    prisma.certificado.deleteMany({ where: { idInscripcion: { in: idsInscripciones } } }),
    prisma.pago.deleteMany({ where: { idInscripcion: { in: idsInscripciones } } }),
    prisma.operacionPago.deleteMany({ where: { OR: [{ idUsuario: { in: idsUsuarios } }, { idExterno: { startsWith: 'PRUEBA-' } }] } }),
    prisma.progreso.deleteMany({ where: { idInscripcion: { in: idsInscripciones } } }),
    prisma.inscripcion.deleteMany({ where: { id: { in: idsInscripciones } } }),
    prisma.carritoItem.deleteMany({ where: { OR: [{ idUsuario: { in: idsUsuarios } }, { idCurso: { in: idsCursos } }] } }),
    prisma.favorito.deleteMany({ where: { OR: [{ idUsuario: { in: idsUsuarios } }, { idCurso: { in: idsCursos } }] } }),
    prisma.contenido.deleteMany({ where: { id: { in: idsContenidos } } }),
    prisma.modulo.deleteMany({ where: { idCurso: { in: idsCursos } } }),
    prisma.cursoColaborador.deleteMany({ where: { OR: [{ idUsuario: { in: idsUsuarios } }, { idCurso: { in: idsCursos } }] } }),
    prisma.curso.deleteMany({ where: { id: { in: idsCursos } } }),
    prisma.usuario.deleteMany({ where: { id: { in: idsUsuarios } } }),
  ]);

  console.log(`Borrados: ${idsUsuarios.length} usuarios de prueba, ${idsCursos.length} cursos y ${idsInscripciones.length} compras.`);
}

main()
  .catch((error) => {
    console.error('Error al borrar los datos de prueba:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

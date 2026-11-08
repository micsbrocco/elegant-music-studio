/* ============================================================
 * Borra los CURSOS DEMO que cargó scripts/cargarCursosDemo.js (los busca
 * por título) con todo su contenido.
 *
 * Uso (desde la carpeta backend):   npm run cursos:demo:borrar
 *
 * Por seguridad, si un curso demo tiene alguna venta real (pago aprobado),
 * no lo borra: lo avisa. Para borrarlo igual: npm run cursos:demo:borrar -- --forzar
 * ============================================================ */
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { borrarCursoDefinitivo } = require('../src/utils/borrarCurso');
const CURSOS = require('./cursosDemo');

async function main() {
  const forzar = process.argv.includes('--forzar');
  const cursos = await prisma.curso.findMany({ where: { titulo: { in: CURSOS.map((c) => c.titulo) } }, select: { id: true, titulo: true } });
  if (cursos.length === 0) {
    console.log('No hay cursos demo para borrar.');
    return;
  }
  for (const curso of cursos) {
    const ventas = await prisma.pago.count({ where: { estado: 'aprobado', inscripcion: { idCurso: curso.id, esVistaPrevia: false } } });
    if (ventas > 0 && !forzar) {
      console.log(`• "${curso.titulo}" tiene ${ventas} venta(s): no se borra (usá --forzar).`);
      continue;
    }
    await prisma.consultaClase.deleteMany({ where: { idCurso: curso.id } });
    await prisma.mensajeRevision.deleteMany({ where: { idCurso: curso.id } });
    await borrarCursoDefinitivo(curso.id);
    console.log(`✓ Borrado "${curso.titulo}" (id ${curso.id}).`);
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());

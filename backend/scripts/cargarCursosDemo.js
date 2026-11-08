/* ============================================================
 * Carga 3 CURSOS DEMO completos (con contenido real) para mostrar la
 * plataforma mientras no estén los cursos definitivos:
 *   - Producción musical: de la idea al tema terminado
 *   - Teoría musical aplicada
 *   - Grabación en home studio
 * Cada uno tiene 7 módulos; cada módulo, dos clases de video con notas y
 * una evaluación con preguntas de opción múltiple.
 *
 * Uso (desde la carpeta backend):   npm run cursos:demo
 * Para borrarlos:                   npm run cursos:demo:borrar
 *
 * - Los crea el primer administrador y quedan publicados.
 * - Las clases de video quedan SIN video: pegá el link (Bunny o YouTube)
 *   desde el editor. Mientras tanto el alumno ve "Esta clase todavía no
 *   tiene video" y la clase se completa al avanzar.
 * - Si un curso con el mismo título ya existe, no lo duplica.
 * - El contenido está en scripts/cursosDemo/: se puede editar ahí.
 * ============================================================ */
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { limpiarHtml } = require('../src/utils/htmlSeguro');
const CURSOS = require('./cursosDemo');

const notaHtml = ({ intro, puntos, practica }) => limpiarHtml(
  `<p>${intro}</p><ul>${puntos.map((p) => `<li>${p}</li>`).join('')}</ul><p><b>Práctica:</b> ${practica}</p>`,
);
const repasoHtml = (texto) => limpiarHtml(`<h2>Lo esencial del módulo</h2><p>${texto}</p>`);

async function main() {
  const admin = await prisma.usuario.findFirst({ where: { rol: 'admin' }, orderBy: { id: 'asc' } });
  if (!admin) throw new Error('No hay ningún usuario administrador.');

  for (const def of CURSOS) {
    const existe = await prisma.curso.findFirst({ where: { titulo: def.titulo, estado: { not: 'archivado' } } });
    if (existe) {
      console.log(`• Ya existe "${def.titulo}" (id ${existe.id}): se saltea.`);
      continue;
    }

    const curso = await prisma.curso.create({
      data: {
        titulo: def.titulo,
        descripcion: def.descripcion,
        precio: def.precio,
        precioOriginal: def.precioOriginal,
        categoria: def.categoria,
        nivel: def.nivel,
        incluye: def.incluye,
        estadisticas: def.estadisticas,
        estado: 'activo',
        emiteCertificado: true,
        idAdminCreador: admin.id,
        colaboradores: { create: { idUsuario: admin.id, visible: true, orden: 0, etiqueta: def.etiquetaInstructor } },
      },
    });

    let clases = 0;
    let preguntas = 0;
    for (const [im, mod] of def.modulos.entries()) {
      const modulo = await prisma.modulo.create({ data: { idCurso: curso.id, titulo: mod.titulo, orden: im + 1 } });
      for (const [ic, cl] of mod.clases.entries()) {
        const esEvaluacion = Boolean(cl.quiz);
        const contenido = await prisma.contenido.create({
          data: {
            idModulo: modulo.id,
            titulo: cl.titulo,
            orden: ic + 1,
            tipo: esEvaluacion ? 'bloques' : 'video',
            urlVideo: null,
            contenidoTexto: esEvaluacion ? null : notaHtml(cl.nota),
          },
        });
        clases += 1;
        if (esEvaluacion) {
          await prisma.bloque.create({ data: { idContenido: contenido.id, tipo: 'texto', orden: 1, contenidoTexto: repasoHtml(cl.repaso) } });
          const quiz = await prisma.bloque.create({ data: { idContenido: contenido.id, tipo: 'quiz', orden: 2 } });
          for (const p of cl.quiz) {
            await prisma.pregunta.create({
              data: {
                idBloque: quiz.id,
                enunciado: p.q,
                opcionA: p.o[0],
                opcionB: p.o[1],
                opcionC: p.o[2] || null,
                opcionD: p.o[3] || null,
                respuestaCorrecta: p.c,
                // Se muestra después de responder, sea cual sea la opción elegida
                explicacionA: p.e, explicacionB: p.e, explicacionC: p.o[2] ? p.e : null, explicacionD: p.o[3] ? p.e : null,
              },
            });
            preguntas += 1;
          }
        }
      }
    }
    console.log(`✓ "${def.titulo}" (id ${curso.id}): ${def.modulos.length} módulos, ${clases} clases, ${preguntas} preguntas.`);
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());

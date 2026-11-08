// Migración de datos: pasa cada clase (Contenido) de tipo 'texto' o 'quiz' a
// la nueva estructura de "bloques" (una clase ahora puede combinar varios
// bloques de texto y de quiz). Las clases de video no se tocan.
//
// Correr UNA SOLA VEZ, después de aplicar la migración de schema que agrega
// el modelo Bloque y la columna Pregunta.idBloque (paso 1), y ANTES del paso
// 2 (el que saca Pregunta.idContenido y hace Pregunta.idBloque obligatorio).
//
// Uso (desde la carpeta backend):
//   node scripts/migrarBloques.js

require('dotenv').config();
const prisma = require('../src/config/prisma');

async function main() {
  const contenidos = await prisma.contenido.findMany({
    where: { tipo: { in: ['texto', 'quiz'] } },
  });

  console.log(`Encontradas ${contenidos.length} clases para migrar a bloques...`);

  for (const contenido of contenidos) {
    const bloque = await prisma.bloque.create({
      data: {
        idContenido: contenido.id,
        tipo: contenido.tipo,
        orden: 1,
        contenidoTexto: contenido.tipo === 'texto' ? contenido.contenidoTexto : null,
      },
    });

    if (contenido.tipo === 'quiz') {
      const { count } = await prisma.pregunta.updateMany({
        where: { idContenido: contenido.id },
        data: { idBloque: bloque.id },
      });
      console.log(`  Clase #${contenido.id} "${contenido.titulo}" (quiz): ${count} pregunta(s) movidas al bloque #${bloque.id}`);
    } else {
      console.log(`  Clase #${contenido.id} "${contenido.titulo}" (texto): contenido movido al bloque #${bloque.id}`);
    }

    await prisma.contenido.update({
      where: { id: contenido.id },
      data: { tipo: 'bloques' },
    });
  }

  console.log('Listo. Todas las clases de texto/quiz ahora son clases de tipo "bloques".');
  console.log('Las clases de video no se tocaron.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error durante la migración:', err);
  await prisma.$disconnect();
  process.exit(1);
});

/* ============================================================
 * Vuelve a generar los PDFs de los certificados ya emitidos con el diseño
 * actual (código de verificación y QR) y les pone un nombre de archivo al azar.
 * Mantiene el mismo código y la misma fecha de emisión. Borra el PDF anterior.
 *
 * Uso (desde la carpeta backend):
 *   npm run certificados:regenerar          solo los de la versión anterior
 *   npm run certificados:regenerar -- --todos   todos
 *
 * No hace falta correrlo: si un alumno abre un certificado viejo, se regenera
 * solo. Sirve para dejar todos al día de una vez (por ejemplo, antes de pasar
 * la carpeta de Supabase a privada, así no queda ningún link público viejo).
 * ============================================================ */
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { regenerarPdf, esVersionVieja } = require('../src/controllers/certificadoController');

(async () => {
  const todos = process.argv.includes('--todos');
  const certificados = await prisma.certificado.findMany({ orderBy: { id: 'asc' } });
  const pendientes = todos ? certificados : certificados.filter(esVersionVieja);
  console.log(`Certificados a regenerar: ${pendientes.length} de ${certificados.length}`);

  let bien = 0;
  for (const certificado of pendientes) {
    try {
      await regenerarPdf(certificado.id);
      bien += 1;
      console.log(`  ✓ certificado ${certificado.id}`);
    } catch (error) {
      console.error(`  ✗ certificado ${certificado.id}:`, error.message || error);
    }
  }
  console.log(`Listo: ${bien} regenerados.`);
  await prisma.$disconnect();
  process.exit(0);
})();

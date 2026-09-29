const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const supabase = require('../config/supabase');

// Genera el PDF del certificado y lo devuelve como buffer
function generarPdfCertificado({ nombreCompleto, tituloCurso, fecha }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const ancho = doc.page.width;
    const alto = doc.page.height;

    // Fondo
    doc.rect(0, 0, ancho, alto).fill('#1a1330');

    // Borde decorativo
    doc.rect(20, 20, ancho - 40, alto - 40).lineWidth(2).stroke('#c9a86a');

    // Marca / nombre de la plataforma
    doc.fillColor('#c9a86a')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('ELEGANT MUSIC STUDIO', 0, 60, { align: 'center' });

    // Título
    doc.fillColor('#ffffff')
      .fontSize(38)
      .font('Helvetica-Bold')
      .text('CERTIFICADO DE FINALIZACIÓN', 0, 120, { align: 'center' });

    // Línea decorativa
    doc.moveTo(ancho / 2 - 80, 175).lineTo(ancho / 2 + 80, 175).lineWidth(2).stroke('#c9a86a');

    // Texto "Otorgado a"
    doc.fillColor('#cccccc')
      .fontSize(14)
      .font('Helvetica')
      .text('Se otorga el presente certificado a', 0, 210, { align: 'center' });

    // Nombre del alumno
    doc.fillColor('#ffffff')
      .fontSize(32)
      .font('Helvetica-Bold')
      .text(nombreCompleto, 0, 240, { align: 'center' });

    // Texto del curso
    doc.fillColor('#cccccc')
      .fontSize(14)
      .font('Helvetica')
      .text('por haber completado satisfactoriamente el curso', 0, 300, { align: 'center' });

    doc.fillColor('#c9a86a')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(tituloCurso, 60, 330, { align: 'center', width: ancho - 120 });

    // Fecha
    doc.fillColor('#cccccc')
      .fontSize(12)
      .font('Helvetica')
      .text(`Emitido el ${fecha}`, 0, alto - 90, { align: 'center' });

    doc.end();
  });
}

async function emitirCertificado(req, res) {
  try {
    const { inscripcionId } = req.params;
    const idUsuario = req.usuario.id;

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: parseInt(inscripcionId) },
      include: { curso: true, usuario: true, certificado: true },
    });

    if (!inscripcion || inscripcion.idUsuario !== idUsuario) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    if (!inscripcion.completado) {
      return res.status(400).json({ error: 'Todavía no completaste este curso' });
    }

    // Si ya existe, lo devolvemos directamente (ahora sí con su URL guardada)
    if (inscripcion.certificado) {
      return res.json(inscripcion.certificado);
    }

    const nombreCompleto = `${inscripcion.usuario.nombre} ${inscripcion.usuario.apellido}`;
    const fecha = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });

    const pdfBuffer = await generarPdfCertificado({
      nombreCompleto,
      tituloCurso: inscripcion.curso.titulo,
      fecha,
    });

    const codigoVerificacion = crypto.randomBytes(8).toString('hex');
    const nombreArchivo = `certificado-${inscripcion.id}-${Date.now()}.pdf`;

    const { error: errorSubida } = await supabase.storage
      .from('certificados')
      .upload(nombreArchivo, pdfBuffer, { contentType: 'application/pdf', upsert: false });

    if (errorSubida) {
      console.error(errorSubida);
      return res.status(500).json({ error: 'Error al subir el certificado' });
    }

    const { data: dataPublica } = supabase.storage.from('certificados').getPublicUrl(nombreArchivo);

    const nuevoCertificado = await prisma.certificado.create({
      data: {
        idInscripcion: inscripcion.id,
        codigoVerificacion,
        urlPdf: dataPublica.publicUrl,
      },
    });

    res.status(201).json(nuevoCertificado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al emitir el certificado' });
  }
}

async function obtenerCertificado(req, res) {
  try {
    const { inscripcionId } = req.params;
    const idUsuario = req.usuario.id;

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: parseInt(inscripcionId) },
      include: { certificado: true },
    });

    if (!inscripcion || inscripcion.idUsuario !== idUsuario) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    if (!inscripcion.certificado) {
      return res.status(404).json({ error: 'Todavía no se emitió un certificado para este curso' });
    }

    res.json(inscripcion.certificado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el certificado' });
  }
}

module.exports = { emitirCertificado, obtenerCertificado };
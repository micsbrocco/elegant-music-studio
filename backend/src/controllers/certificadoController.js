const PDFDocument = require('pdfkit');
const { INSCRIPCION_VIGENTE, ESTADOS_PAGO_REVERTIDO } = require('../utils/inscripcionVigente');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const supabase = require('../config/supabase');

const path = require('path');
const QRCode = require('qrcode');

// Versión del logo en un dorado más profundo, para que se lea sobre el papel claro
const LOGO = path.join(__dirname, '..', 'assets', 'logo-elegant-oscuro.png');
const NEGRO = '#121214';
const DORADO = '#c9a227';
const DORADO_OSCURO = '#9c7a14';
const GRIS = '#6b6b73';

// Carpeta de Supabase donde se guardan los PDFs. Tiene que ser PRIVADA: el PDF
// se abre con un link firmado que vence a los pocos minutos.
const CARPETA = 'certificados';
const MINUTOS_LINK = 5;

// Dirección pública de la página (para el QR de verificación)
function direccionSitio() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
}

// El código se guarda como 16 letras/números; en el PDF se muestra de a grupos
const formatearCodigo = (codigo) => String(codigo).toUpperCase().match(/.{1,4}/g).join('-');
const normalizarCodigo = (texto) => String(texto || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

// Achica la letra hasta que el texto entre en una línea (sin bajar del mínimo)
function tamanoQueEntra(doc, texto, fuente, maximo, minimo, ancho) {
  let tamano = maximo;
  doc.font(fuente);
  while (tamano > minimo && doc.fontSize(tamano).widthOfString(texto) > ancho) tamano -= 1;
  return tamano;
}

// Rombo centrado en (cx, cy) con "radio" r (mitad de la diagonal)
function rombo(doc, cx, cy, r, color, opacidad = 1) {
  doc.save()
    .fillOpacity(opacidad)
    .moveTo(cx, cy - r)
    .lineTo(cx + r, cy)
    .lineTo(cx, cy + r)
    .lineTo(cx - r, cy)
    .closePath()
    .fill(color)
    .restore();
}

// Escalera de rombos en una esquina (como el ecualizador del logo): cada fila
// tiene un rombo menos y se van apagando hacia adentro.
// dx/dy indican hacia dónde crece (1 o -1) desde la esquina (x0, y0).
function escaleraDeRombos(doc, x0, y0, dx, dy) {
  const paso = 17;
  const filas = 6;
  for (let fila = 0; fila < filas; fila += 1) {
    for (let col = 0; col < filas - fila; col += 1) {
      const cx = x0 + dx * (col * paso + (fila % 2) * (paso / 2));
      const cy = y0 + dy * fila * (paso * 0.9);
      const lejos = (col + fila) / filas;
      // Algunos negros (siempre plenos) entre los dorados, que se van apagando
      const negro = (col * 2 + fila) % 5 === 1 && lejos < 0.7;
      rombo(doc, cx, cy, 6.2, negro ? NEGRO : DORADO, negro ? 1 : Math.max(0.18, 1 - lejos * 0.85));
    }
  }
}

// Genera el PDF del certificado y lo devuelve como buffer.
// Estética del estudio: fondo marfil con marco negro y filete dorado, rombos
// dorados y negros en dos esquinas (como el logo), el logo arriba al centro y
// el contenido centrado debajo.
async function generarPdfCertificado({ nombreCompleto, tituloCurso, fecha, codigoVerificacion }) {
  // QR que lleva a la página de verificación del certificado
  const urlVerificacion = codigoVerificacion ? `${direccionSitio()}/verificar/${formatearCodigo(codigoVerificacion)}` : null;
  const qr = urlVerificacion
    ? await QRCode.toBuffer(urlVerificacion, { margin: 0, scale: 8, errorCorrectionLevel: 'M', color: { dark: NEGRO, light: '#fbfaf6' } })
    : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const ancho = doc.page.width; // 842
    const alto = doc.page.height; // 595
    const centro = ancho / 2;

    // Marco negro y papel marfil
    doc.rect(0, 0, ancho, alto).fill(NEGRO);
    doc.rect(22, 22, ancho - 44, alto - 44).fill('#fbfaf6');
    // Filete dorado doble
    doc.rect(32, 32, ancho - 64, alto - 64).lineWidth(1.2).stroke(DORADO);
    doc.rect(37, 37, ancho - 74, alto - 74).lineWidth(0.5).stroke(DORADO);

    // Franja negra abajo, con filete dorado y rombos en las puntas (ahí va la fecha)
    const franja = { y: alto - 96, alto: 59 };
    doc.rect(37, franja.y, ancho - 74, franja.alto).fill(NEGRO);
    doc.moveTo(37, franja.y).lineTo(ancho - 37, franja.y).lineWidth(1.2).stroke(DORADO);
    [60, 76, 92].forEach((dx, i) => {
      rombo(doc, dx, franja.y + franja.alto / 2, 5 - i, DORADO, 1 - i * 0.3);
      rombo(doc, ancho - dx, franja.y + franja.alto / 2, 5 - i, DORADO, 1 - i * 0.3);
    });

    // Rombos en las dos esquinas de arriba, a los lados del logo
    escaleraDeRombos(doc, 56, 56, 1, 1);
    escaleraDeRombos(doc, ancho - 56, 56, -1, 1);

    // Logo arriba al centro
    try {
      doc.image(LOGO, centro - 80, 44, { width: 160 });
    } catch (e) {
      // Si el logo no está, el certificado sale igual
    }

    // Contenido centrado
    const x = 90;
    const w = ancho - 180;

    doc.fillColor(DORADO_OSCURO)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('ELEGANT MUSIC STUDIO', x, 172, { width: w, align: 'center', characterSpacing: 3 });

    doc.fillColor(NEGRO)
      .font('Times-Roman')
      .fontSize(40)
      .text('CERTIFICADO', x, 192, { width: w, align: 'center', characterSpacing: 7 });
    doc.fillColor(NEGRO)
      .font('Times-Roman')
      .fontSize(14)
      .text('DE FINALIZACIÓN', x, 238, { width: w, align: 'center', characterSpacing: 5 });

    // Separador: líneas con tres rombos
    doc.moveTo(centro - 120, 272).lineTo(centro - 22, 272).lineWidth(0.8).stroke(DORADO);
    doc.moveTo(centro + 22, 272).lineTo(centro + 120, 272).lineWidth(0.8).stroke(DORADO);
    rombo(doc, centro - 12, 272, 3, DORADO);
    rombo(doc, centro, 272, 5, NEGRO);
    rombo(doc, centro + 12, 272, 3, DORADO);

    doc.fillColor(GRIS)
      .font('Helvetica')
      .fontSize(12.5)
      .text('Se otorga el presente certificado a', x, 298, { width: w, align: 'center' });

    // Nombre del alumno, con una línea fina debajo
    const tamanoNombre = tamanoQueEntra(doc, nombreCompleto, 'Times-BoldItalic', 40, 22, w - 40);
    doc.fillColor(NEGRO)
      .font('Times-BoldItalic')
      .fontSize(tamanoNombre)
      .text(nombreCompleto, x, 320 + (40 - tamanoNombre) * 0.6, { width: w, align: 'center', lineBreak: false, ellipsis: true });
    doc.moveTo(centro - 190, 374).lineTo(centro + 190, 374).lineWidth(0.8).stroke('#b9b4a6');

    doc.fillColor(GRIS)
      .font('Helvetica')
      .fontSize(12.5)
      .text('por haber completado satisfactoriamente el curso', x, 390, { width: w, align: 'center' });

    // El nombre del curso puede ocupar hasta dos líneas
    const tamanoCurso = tamanoQueEntra(doc, tituloCurso, 'Helvetica-Bold', 20, 15, (w - 120) * 2);
    doc.fillColor(DORADO_OSCURO)
      .font('Helvetica-Bold')
      .fontSize(tamanoCurso)
      .text(tituloCurso, x + 60, 414, { width: w - 120, align: 'center', height: tamanoCurso * 2.6, ellipsis: true });

    // Fecha
    doc.fillColor('#d9c48a')
      .font('Helvetica')
      .fontSize(11)
      .text(`Emitido el ${fecha}`, x, franja.y + franja.alto / 2 - 6, { width: w, align: 'center', characterSpacing: 0.5 });

    // Verificación: el código a la izquierda de la franja y el QR a la derecha
    if (qr) {
      doc.fillColor('#8f8a7c')
        .font('Helvetica')
        .fontSize(7.5)
        .text('CÓDIGO DE VERIFICACIÓN', 112, franja.y + 17, { characterSpacing: 1, lineBreak: false });
      doc.fillColor('#d9c48a')
        .font('Courier-Bold')
        .fontSize(10)
        .text(formatearCodigo(codigoVerificacion), 112, franja.y + 29, { characterSpacing: 0.5, lineBreak: false });

      const lado = 45;
      const qrX = ancho - 112 - lado;
      const qrY = franja.y + (franja.alto - lado) / 2;
      doc.rect(qrX - 3, qrY - 3, lado + 6, lado + 6).fill('#fbfaf6');
      doc.image(qr, qrX, qrY, { width: lado, height: lado });
    }

    doc.end();
  });
}

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });

// En la base se guarda la ruta del archivo dentro de la carpeta. Los certificados
// de la versión anterior guardaban el link público completo.
function rutaDelPdf(urlPdf) {
  if (!urlPdf) return null;
  const marca = `/${CARPETA}/`;
  return urlPdf.startsWith('http') ? decodeURIComponent(urlPdf.slice(urlPdf.lastIndexOf(marca) + marca.length)) : urlPdf;
}
const esVersionVieja = (certificado) => !certificado.urlPdf || certificado.urlPdf.startsWith('http');

// Genera el PDF, lo sube con un nombre al azar y devuelve su ruta
async function generarYSubir(datos) {
  const pdf = await generarPdfCertificado(datos);
  const ruta = `certificado-${crypto.randomBytes(16).toString('hex')}.pdf`;
  const { error } = await supabase.storage.from(CARPETA).upload(ruta, pdf, { contentType: 'application/pdf', upsert: false });
  if (error) throw error;
  return ruta;
}

// Vuelve a generar el PDF de un certificado ya emitido (mismo código y fecha),
// con el diseño actual, y borra el archivo anterior.
async function regenerarPdf(idCertificado) {
  const certificado = await prisma.certificado.findUnique({
    where: { id: idCertificado },
    include: { inscripcion: { include: { usuario: true, curso: true } } },
  });
  const { usuario, curso } = certificado.inscripcion;
  const ruta = await generarYSubir({
    nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
    tituloCurso: curso.titulo,
    fecha: formatearFecha(certificado.fechaEmision),
    codigoVerificacion: certificado.codigoVerificacion,
  });
  const anterior = rutaDelPdf(certificado.urlPdf);
  const actualizado = await prisma.certificado.update({ where: { id: certificado.id }, data: { urlPdf: ruta } });
  if (anterior) await supabase.storage.from(CARPETA).remove([anterior]).catch(() => {});
  return actualizado;
}

// Devuelve el certificado con un link que vence en unos minutos (en vez de la ruta)
async function conLinkFirmado(certificado) {
  const { data, error } = await supabase.storage
    .from(CARPETA)
    .createSignedUrl(rutaDelPdf(certificado.urlPdf), MINUTOS_LINK * 60);
  if (error) throw error;
  return {
    id: certificado.id,
    fechaEmision: certificado.fechaEmision,
    codigoVerificacion: formatearCodigo(certificado.codigoVerificacion),
    urlPdf: data.signedUrl,
  };
}

async function emitirCertificado(req, res) {
  try {
    const { inscripcionId } = req.params;
    const idUsuario = req.usuario.id;

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: parseInt(inscripcionId) },
      include: { curso: true, usuario: true, certificado: true, pago: { select: { estado: true } } },
    });

    // Una compra reembolsada no da derecho al certificado
    if (!inscripcion || inscripcion.idUsuario !== idUsuario || ESTADOS_PAGO_REVERTIDO.includes(inscripcion.pago?.estado)) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    if (!inscripcion.completado) {
      return res.status(400).json({ error: 'Todavía no completaste este curso' });
    }

    // Si ya existe, se devuelve con un link nuevo (y si era de la versión
    // anterior, sin código ni QR, se regenera primero)
    if (inscripcion.certificado) {
      let certificado = inscripcion.certificado;
      if (esVersionVieja(certificado)) certificado = await regenerarPdf(certificado.id);
      return res.json(await conLinkFirmado(certificado));
    }

    const codigoVerificacion = crypto.randomBytes(8).toString('hex');
    const ruta = await generarYSubir({
      nombreCompleto: `${inscripcion.usuario.nombre} ${inscripcion.usuario.apellido}`,
      tituloCurso: inscripcion.curso.titulo,
      fecha: formatearFecha(new Date()),
      codigoVerificacion,
    });

    const nuevoCertificado = await prisma.certificado.create({
      data: { idInscripcion: inscripcion.id, codigoVerificacion, urlPdf: ruta },
    });

    res.status(201).json(await conLinkFirmado(nuevoCertificado));
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

    let certificado = inscripcion.certificado;
    if (esVersionVieja(certificado)) certificado = await regenerarPdf(certificado.id);
    res.json(await conLinkFirmado(certificado));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el certificado' });
  }
}

// Cursos terminados del usuario logueado que emiten certificado, con el
// certificado ya emitido (si existe). Si todavía no se generó el PDF, el
// frontend lo pide con "emitir", que además devuelve el existente si ya estaba.
async function listarMisCertificados(req, res) {
  try {
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        idUsuario: req.usuario.id,
        completado: true,
        curso: { emiteCertificado: true },
        ...INSCRIPCION_VIGENTE,
      },
      orderBy: { fechaInscripcion: 'desc' },
      select: {
        id: true,
        curso: { select: { id: true, titulo: true, categoria: true, imagenPortada: true } },
        certificado: { select: { id: true, fechaEmision: true } },
      },
    });

    res.json(
      inscripciones.map((i) => ({
        idInscripcion: i.id,
        curso: i.curso,
        certificado: i.certificado,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron cargar tus certificados' });
  }
}

// Público: cualquiera con el código (o el QR del PDF) puede comprobar que el
// certificado es real. Solo muestra nombre, curso y fecha.
async function verificarCertificado(req, res) {
  try {
    const codigo = normalizarCodigo(req.params.codigo);
    if (!/^[a-f0-9]{16}$/.test(codigo)) {
      return res.status(404).json({ valido: false });
    }
    const certificado = await prisma.certificado.findUnique({
      where: { codigoVerificacion: codigo },
      include: {
        inscripcion: {
          select: {
            usuario: { select: { nombre: true, apellido: true } },
            curso: { select: { titulo: true } },
            pago: { select: { estado: true } },
          },
        },
      },
    });
    if (!certificado) return res.status(404).json({ valido: false });

    const { usuario, curso, pago } = certificado.inscripcion;
    res.json({
      // Si la compra se reembolsó, el certificado queda anulado
      valido: !ESTADOS_PAGO_REVERTIDO.includes(pago?.estado),
      codigo: formatearCodigo(certificado.codigoVerificacion),
      nombre: `${usuario.nombre} ${usuario.apellido}`,
      curso: curso.titulo,
      fechaEmision: certificado.fechaEmision,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo verificar el certificado' });
  }
}

module.exports = {
  generarPdfCertificado, emitirCertificado, obtenerCertificado, listarMisCertificados,
  verificarCertificado, regenerarPdf, esVersionVieja,
};
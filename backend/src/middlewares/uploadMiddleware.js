const multer = require('multer');

const storage = multer.memoryStorage(); // guarda el archivo en memoria, no en disco

function filtroImagen(req, file, cb) {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Solo se permiten imágenes JPG, PNG o WEBP');
    error.esErrorDeValidacion = true;
    cb(error);
  }
}

function filtroArchivoLeccion(req, file, cb) {
  const tiposPermitidos = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'video/mp4',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Tipo de archivo no permitido. Subí un PDF, ZIP, audio, video, Word, PowerPoint o imagen.');
    error.esErrorDeValidacion = true;
    cb(error);
  }
}

// Imágenes (portadas de curso, fotos de perfil): 20MB alcanza de sobra para una foto de portada.
const upload = multer({
  storage,
  fileFilter: filtroImagen,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Archivos descargables de una clase (PDF, ZIP, audio, etc.): hasta 50MB, el máximo por archivo
// que soporta el plan gratuito de Supabase Storage. Para algo más pesado (video largo, stems
// completos) conviene subirlo a un servicio externo y dejar el enlace en la clase.
const uploadArchivoLeccion = multer({
  storage,
  fileFilter: filtroArchivoLeccion,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
module.exports.uploadArchivoLeccion = uploadArchivoLeccion;

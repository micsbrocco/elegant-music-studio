const multer = require('multer');

const storage = multer.memoryStorage(); // guarda el archivo en memoria, no en disco

function filtroArchivo(req, file, cb) {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
}

const upload = multer({
  storage,
  fileFilter: filtroArchivo,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB máximo
});

module.exports = upload;
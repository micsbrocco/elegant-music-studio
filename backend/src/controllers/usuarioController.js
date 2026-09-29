const prisma = require('../config/prisma');
const supabase = require('../config/supabase');

async function obtenerPerfil(req, res) {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { password, resetPasswordToken, resetPasswordExpires, ...perfil } = usuario;
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
}

async function editarPerfil(req, res) {
  try {
    const { nombre, apellido, descripcion, genero } = req.body;

    const generosValidos = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'];
    if (genero && !generosValidos.includes(genero)) {
      return res.status(400).json({ error: 'Género inválido' });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { nombre, apellido, descripcion, genero },
    });

    const { password, resetPasswordToken, resetPasswordExpires, ...perfil } = usuarioActualizado;
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el perfil' });
  }
}

async function subirFotoPerfil(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const extension = req.file.originalname.split('.').pop();
    const nombreArchivo = `usuario-${req.usuario.id}-${Date.now()}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from('perfiles')
      .upload(nombreArchivo, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (errorSubida) {
      console.error(errorSubida);
      return res.status(500).json({ error: 'Error al subir la imagen' });
    }

    const { data: dataPublica } = supabase.storage
      .from('perfiles')
      .getPublicUrl(nombreArchivo);

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { fotoPerfil: dataPublica.publicUrl },
    });

    const { password, resetPasswordToken, resetPasswordExpires, ...perfil } = usuarioActualizado;
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir la foto de perfil' });
  }
}

module.exports = { obtenerPerfil, editarPerfil, subirFotoPerfil };
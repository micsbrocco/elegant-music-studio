const prisma = require('../config/prisma');

async function crearContenido(req, res) {
  try {
    const { moduloId } = req.params;
    const { titulo, orden, tipo, contenidoTexto, urlVideo, archivoDescargable } = req.body;

    if (!titulo || orden === undefined || !tipo) {
      return res.status(400).json({ error: 'Título, orden y tipo son obligatorios' });
    }

    const tiposValidos = ['video', 'texto', 'quiz'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Debe ser: video, texto o quiz' });
    }

    const modulo = await prisma.modulo.findUnique({ where: { id: parseInt(moduloId) } });
    if (!modulo) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    const nuevoContenido = await prisma.contenido.create({
      data: {
        idModulo: parseInt(moduloId),
        titulo,
        orden,
        tipo,
        contenidoTexto: contenidoTexto || null,
        urlVideo: urlVideo || null,
        archivoDescargable: archivoDescargable || null,
      },
    });

    res.status(201).json(nuevoContenido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el contenido' });
  }
}

async function obtenerContenido(req, res) {
  try {
    const { id } = req.params;
    const contenido = await prisma.contenido.findUnique({ where: { id: parseInt(id) } });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    res.json(contenido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el contenido' });
  }
}

async function editarContenido(req, res) {
  try {
    const { id } = req.params;
    const { titulo, orden, tipo, contenidoTexto, urlVideo, archivoDescargable } = req.body;

    const contenidoExistente = await prisma.contenido.findUnique({ where: { id: parseInt(id) } });
    if (!contenidoExistente) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    const contenidoActualizado = await prisma.contenido.update({
      where: { id: parseInt(id) },
      data: { titulo, orden, tipo, contenidoTexto, urlVideo, archivoDescargable },
    });

    res.json(contenidoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el contenido' });
  }
}

async function eliminarContenido(req, res) {
  try {
    const { id } = req.params;

    const contenidoExistente = await prisma.contenido.findUnique({ where: { id: parseInt(id) } });
    if (!contenidoExistente) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    await prisma.contenido.delete({ where: { id: parseInt(id) } });

    res.json({ mensaje: 'Contenido eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el contenido' });
  }
}

async function reordenarContenido(req, res) {
  try {
    const { id } = req.params;
    const { direccion } = req.body;

    const contenido = await prisma.contenido.findUnique({ where: { id: parseInt(id) } });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    const vecino = await prisma.contenido.findFirst({
      where: {
        idModulo: contenido.idModulo,
        orden: direccion === 'subir' ? { lt: contenido.orden } : { gt: contenido.orden },
      },
      orderBy: { orden: direccion === 'subir' ? 'desc' : 'asc' },
    });

    if (!vecino) {
      return res.status(400).json({ error: 'El contenido ya está en un extremo, no se puede mover más' });
    }

    await prisma.$transaction([
      prisma.contenido.update({ where: { id: contenido.id }, data: { orden: vecino.orden } }),
      prisma.contenido.update({ where: { id: vecino.id }, data: { orden: contenido.orden } }),
    ]);

    res.json({ mensaje: 'Contenido reordenado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reordenar el contenido' });
  }
}

module.exports = {
  crearContenido,
  obtenerContenido,
  editarContenido,
  eliminarContenido,
  reordenarContenido,
};
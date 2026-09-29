const prisma = require('../config/prisma');

// Crear un módulo (agrupador) dentro de un curso (solo admin)
async function crearModulo(req, res) {
  try {
    const { cursoId } = req.params;
    const { titulo, orden } = req.body;

    if (!titulo || orden === undefined) {
      return res.status(400).json({ error: 'Título y orden son obligatorios' });
    }

    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const nuevoModulo = await prisma.modulo.create({
      data: { idCurso: parseInt(cursoId), titulo, orden },
    });

    res.status(201).json(nuevoModulo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el módulo' });
  }
}

async function obtenerModulo(req, res) {
  try {
    const { id } = req.params;
    const modulo = await prisma.modulo.findUnique({
      where: { id: parseInt(id) },
      include: { contenidos: { orderBy: { orden: 'asc' } } },
    });
    if (!modulo) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    res.json(modulo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el módulo' });
  }
}

async function editarModulo(req, res) {
  try {
    const { id } = req.params;
    const { titulo, orden } = req.body;

    const moduloExistente = await prisma.modulo.findUnique({ where: { id: parseInt(id) } });
    if (!moduloExistente) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    const moduloActualizado = await prisma.modulo.update({
      where: { id: parseInt(id) },
      data: { titulo, orden },
    });

    res.json(moduloActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el módulo' });
  }
}

async function eliminarModulo(req, res) {
  try {
    const { id } = req.params;

    const moduloExistente = await prisma.modulo.findUnique({ where: { id: parseInt(id) } });
    if (!moduloExistente) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    await prisma.modulo.delete({ where: { id: parseInt(id) } });

    res.json({ mensaje: 'Módulo eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el módulo' });
  }
}

async function reordenarModulo(req, res) {
  try {
    const { id } = req.params;
    const { direccion } = req.body;

    const modulo = await prisma.modulo.findUnique({ where: { id: parseInt(id) } });
    if (!modulo) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    const moduloVecino = await prisma.modulo.findFirst({
      where: {
        idCurso: modulo.idCurso,
        orden: direccion === 'subir' ? { lt: modulo.orden } : { gt: modulo.orden },
      },
      orderBy: { orden: direccion === 'subir' ? 'desc' : 'asc' },
    });

    if (!moduloVecino) {
      return res.status(400).json({ error: 'El módulo ya está en un extremo, no se puede mover más' });
    }

    await prisma.$transaction([
      prisma.modulo.update({ where: { id: modulo.id }, data: { orden: moduloVecino.orden } }),
      prisma.modulo.update({ where: { id: moduloVecino.id }, data: { orden: modulo.orden } }),
    ]);

    res.json({ mensaje: 'Módulo reordenado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reordenar el módulo' });
  }
}

module.exports = { crearModulo, obtenerModulo, editarModulo, eliminarModulo, reordenarModulo };
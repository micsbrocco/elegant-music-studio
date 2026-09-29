const prisma = require('../config/prisma');

async function agregarFavorito(req, res) {
  try {
    const { cursoId } = req.body;
    const idUsuario = req.usuario.id;

    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const favorito = await prisma.favorito.create({
      data: { idUsuario, idCurso: parseInt(cursoId) },
    });

    res.status(201).json(favorito);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Este curso ya está en tus favoritos' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al agregar a favoritos' });
  }
}

async function verFavoritos(req, res) {
  try {
    const idUsuario = req.usuario.id;

    const favoritos = await prisma.favorito.findMany({
      where: { idUsuario },
      include: { curso: true },
      orderBy: { fechaAgregado: 'desc' },
    });

    res.json(favoritos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los favoritos' });
  }
}

async function quitarFavorito(req, res) {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;

    const favorito = await prisma.favorito.findUnique({ where: { id: parseInt(id) } });
    if (!favorito || favorito.idUsuario !== idUsuario) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    await prisma.favorito.delete({ where: { id: parseInt(id) } });
    res.json({ mensaje: 'Eliminado de favoritos' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al quitar de favoritos' });
  }
}

module.exports = { agregarFavorito, verFavoritos, quitarFavorito };
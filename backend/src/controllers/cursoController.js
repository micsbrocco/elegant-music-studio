const prisma = require('../config/prisma');

// Crear un curso (solo admin)
async function crearCurso(req, res) {
  try {
    const { titulo, descripcion, precio, categoria, imagenPortada } = req.body;

    if (!titulo || !descripcion || !precio || !categoria) {
      return res.status(400).json({ error: 'Título, descripción, precio y categoría son obligatorios' });
    }

    const nuevoCurso = await prisma.curso.create({
      data: {
        titulo,
        descripcion,
        precio,
        categoria,
        imagenPortada: imagenPortada || null,
        idAdminCreador: req.usuario.id, // viene del token, gracias al middleware
      },
    });

    res.status(201).json(nuevoCurso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el curso' });
  }
}

// Listar todos los cursos (público, para el catálogo)
async function listarCursos(req, res) {
  try {
    const cursos = await prisma.curso.findMany({
      orderBy: { id: 'desc' },
    });
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar cursos' });
  }
}

// Ver el detalle de un curso puntual (público)
async function obtenerCurso(req, res) {
  try {
    const { id } = req.params;

    const curso = await prisma.curso.findUnique({
      where: { id: parseInt(id) },
      include: {
        modulos: {
          orderBy: { orden: 'asc' },
          include: {
            contenidos: { orderBy: { orden: 'asc' } },
          },
        },
      },
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el curso' });
  }
}

// Editar un curso (solo admin)
async function editarCurso(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descripcion, precio, categoria, imagenPortada } = req.body;

    const cursoExistente = await prisma.curso.findUnique({ where: { id: parseInt(id) } });
    if (!cursoExistente) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const cursoActualizado = await prisma.curso.update({
      where: { id: parseInt(id) },
      data: { titulo, descripcion, precio, categoria, imagenPortada },
    });

    res.json(cursoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el curso' });
  }
}

// Eliminar un curso (solo admin)
async function eliminarCurso(req, res) {
  try {
    const { id } = req.params;

    const cursoExistente = await prisma.curso.findUnique({ where: { id: parseInt(id) } });
    if (!cursoExistente) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    await prisma.curso.delete({ where: { id: parseInt(id) } });

    res.json({ mensaje: 'Curso eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el curso' });
  }
}

module.exports = { crearCurso, listarCursos, obtenerCurso, editarCurso, eliminarCurso };
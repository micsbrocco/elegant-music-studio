const prisma = require('../config/prisma');
const { puedeOperarSobreCurso, puedeVerContenidoCurso, idCursoDeModulo } = require('../utils/permisosCurso');

// Crear un módulo (agrupador) dentro de un curso (admin, o instructor dueño del curso)
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
    if (!(await puedeOperarSobreCurso(req.usuario, curso.id))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
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
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del módulo no es válido' });
    }
    const modulo = await prisma.modulo.findUnique({
      where: { id: parseInt(id) },
      include: { contenidos: { orderBy: { orden: 'asc' } } },
    });
    if (!modulo) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    // Solo admin, instructor del curso o alumno inscripto pueden ver el contenido
    if (!(await puedeVerContenidoCurso(req.usuario, modulo.idCurso))) {
      return res.status(403).json({ error: 'No tenés acceso a este módulo' });
    }
    // Al alumno no le llegan las clases ocultas
    if (!(await puedeOperarSobreCurso(req.usuario, modulo.idCurso))) {
      modulo.contenidos = modulo.contenidos.filter((c) => c.visible !== false);
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
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del módulo no es válido' });
    }
    const { titulo, orden } = req.body;

    const moduloExistente = await prisma.modulo.findUnique({ where: { id: parseInt(id) } });
    if (!moduloExistente) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, moduloExistente.idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
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
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del módulo no es válido' });
    }

    const moduloExistente = await prisma.modulo.findUnique({ where: { id: parseInt(id) } });
    if (!moduloExistente) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, moduloExistente.idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    const idModulo = parseInt(id);

    // Se borra todo junto o nada: primero las respuestas de los quizzes (no tienen
    // borrado en cascada), después las clases (que arrastran bloques, preguntas,
    // archivos y progreso) y por último el módulo.
    await prisma.$transaction([
      prisma.respuestaPregunta.deleteMany({
        where: { pregunta: { bloque: { contenido: { idModulo } } } },
      }),
      prisma.contenido.deleteMany({ where: { idModulo } }),
      prisma.modulo.delete({ where: { id: idModulo } }),
    ]);

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
    if (!(await puedeOperarSobreCurso(req.usuario, modulo.idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
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

// Reordena en un solo pedido una lista completa de módulos (drag & drop del editor de curso)
async function reordenarModulosLote(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se necesita un array de ids' });
    }

    // Todo este lote siempre pertenece a un solo curso (se reordena desde el
    // editor de ese curso): alcanza con validar el dueño una vez, con el primero.
    const idCurso = await idCursoDeModulo(parseInt(ids[0]));
    if (!(await puedeOperarSobreCurso(req.usuario, idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    await prisma.$transaction(
      ids.map((id, indice) =>
        prisma.modulo.update({ where: { id: parseInt(id) }, data: { orden: indice + 1 } })
      )
    );

    res.json({ mensaje: 'Módulos reordenados correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reordenar los módulos' });
  }
}

module.exports = {
  crearModulo,
  obtenerModulo,
  editarModulo,
  eliminarModulo,
  reordenarModulo,
  reordenarModulosLote,
};
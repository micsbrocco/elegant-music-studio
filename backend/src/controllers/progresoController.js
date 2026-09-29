const prisma = require('../config/prisma');

async function marcarProgreso(req, res) {
  try {
    const { contenidoId } = req.params;
    const idUsuario = req.usuario.id;

    const contenido = await prisma.contenido.findUnique({ where: { id: parseInt(contenidoId) } });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    const modulo = await prisma.modulo.findUnique({ where: { id: contenido.idModulo } });

    const inscripcion = await prisma.inscripcion.findFirst({
      where: { idUsuario, idCurso: modulo.idCurso },
    });
    if (!inscripcion) {
      return res.status(403).json({ error: 'No estás inscripto en este curso' });
    }

    const progreso = await prisma.progreso.upsert({
      where: {
        idInscripcion_idContenido: { idInscripcion: inscripcion.id, idContenido: contenido.id },
      },
      update: { completado: true, fecha: new Date() },
      create: { idInscripcion: inscripcion.id, idContenido: contenido.id, completado: true },
    });

    await sincronizarCursoCompleto(inscripcion.id, modulo.idCurso);

    res.json(progreso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al marcar el progreso' });
  }
}

async function verificarCursoCompleto(idInscripcion, idCurso) {
  // Contamos el total de "contenidos" (no módulos) de todos los módulos del curso
  const modulos = await prisma.modulo.findMany({ where: { idCurso }, select: { id: true } });
  const idsModulos = modulos.map((m) => m.id);

  const totalContenidos = await prisma.contenido.count({ where: { idModulo: { in: idsModulos } } });
  const contenidosCompletados = await prisma.progreso.count({
    where: { idInscripcion, completado: true },
  });

  if (totalContenidos > 0 && contenidosCompletados >= totalContenidos) {
    await prisma.inscripcion.update({
      where: { id: idInscripcion },
      data: { completado: true },
    });
  }
}

async function obtenerProgresoCurso(req, res) {
  try {
    const { cursoId } = req.params;
    const idUsuario = req.usuario.id;

    const inscripcion = await prisma.inscripcion.findFirst({
      where: { idUsuario, idCurso: parseInt(cursoId) },
    });
    if (!inscripcion) {
      return res.status(403).json({ error: 'No estás inscripto en este curso' });
    }

    const progresos = await prisma.progreso.findMany({
      where: { idInscripcion: inscripcion.id, completado: true },
    });

    const modulos = await prisma.modulo.findMany({ where: { idCurso: parseInt(cursoId) }, select: { id: true } });
    const idsModulos = modulos.map((m) => m.id);
    const totalContenidos = await prisma.contenido.count({ where: { idModulo: { in: idsModulos } } });

    const idsContenidosCompletados = [...new Set(progresos.map((p) => p.idContenido))];
    const completados = idsContenidosCompletados.length;

    const porcentaje = totalContenidos > 0 ? Math.min(100, Math.round((completados / totalContenidos) * 100)) : 0;
    const completadoReal = totalContenidos > 0 && completados >= totalContenidos;

    res.json({
      inscripcionId: inscripcion.id,
      completado: completadoReal,
      porcentaje,
      contenidosCompletados: idsContenidosCompletados,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el progreso' });
  }
}

module.exports = { marcarProgreso, obtenerProgresoCurso };
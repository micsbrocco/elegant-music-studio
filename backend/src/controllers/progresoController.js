const prisma = require('../config/prisma');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');
const { puedeOperarSobreCurso } = require('../utils/permisosCurso');
const {
  SEGUNDOS_TRAMO, PORCENTAJE_MINIMO, DURACION_MAXIMA, videoConSeguimiento, porcentajeVisto, sumarTramos,
} = require('../utils/videoVisto');

// Si el que pide esto es admin o el instructor dueño del curso y todavía no
// tiene una inscripción, le creamos una de "vista previa": así puede ver el
// curso, marcar progreso y responder quizzes exactamente como lo haría un
// alumno, sin tener que comprarlo. No cuenta como venta (se filtra aparte en
// los reportes y en el conteo de alumnos).
async function obtenerOCrearInscripcionDeVistaPrevia(usuario, idCurso) {
  let inscripcion = await prisma.inscripcion.findFirst({
    where: { idUsuario: usuario.id, idCurso, ...INSCRIPCION_VIGENTE },
  });
  if (inscripcion) return inscripcion;

  if (!(await puedeOperarSobreCurso(usuario, idCurso))) {
    return null;
  }

  return prisma.inscripcion.create({
    data: { idUsuario: usuario.id, idCurso, esVistaPrevia: true },
  });
}

// Calcula el resumen de progreso de un curso (porcentaje, completados, si está
// terminado) para una inscripción puntual. El conteo de contenidos totales y la
// búsqueda de los ya completados son independientes entre sí, así que se piden
// en paralelo en vez de uno atrás del otro.
async function calcularResumenProgreso(idInscripcion, idCurso) {
  const modulos = await prisma.modulo.findMany({ where: { idCurso }, select: { id: true } });
  const idsModulos = modulos.map((m) => m.id);

  const [totalContenidos, progresos] = await Promise.all([
    prisma.contenido.count({ where: { idModulo: { in: idsModulos }, visible: true } }),
    prisma.progreso.findMany({ where: { idInscripcion, completado: true, contenido: { visible: true } } }),
  ]);

  const idsContenidosCompletados = [...new Set(progresos.map((p) => p.idContenido))];
  const completados = idsContenidosCompletados.length;

  const porcentaje = totalContenidos > 0 ? Math.min(100, Math.round((completados / totalContenidos) * 100)) : 0;
  const completado = totalContenidos > 0 && completados >= totalContenidos;

  return {
    inscripcionId: idInscripcion,
    completado,
    porcentaje,
    contenidosCompletados: idsContenidosCompletados,
  };
}

// Recalcula el resumen y, si ya está todo completado, marca la inscripción
// como terminada. Devuelve el resumen para que marcarProgreso lo reenvíe tal
// cual en su respuesta, sin que el frontend tenga que volver a pedirlo aparte.
async function sincronizarCursoCompleto(idInscripcion, idCurso) {
  const resumen = await calcularResumenProgreso(idInscripcion, idCurso);
  if (resumen.completado) {
    await prisma.inscripcion.update({
      where: { id: idInscripcion },
      data: { completado: true },
    });
  }
  return resumen;
}

async function marcarProgreso(req, res) {
  try {
    const { contenidoId } = req.params;
    const idUsuario = req.usuario.id;

    const contenido = await prisma.contenido.findUnique({ where: { id: parseInt(contenidoId) } });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    const modulo = await prisma.modulo.findUnique({ where: { id: contenido.idModulo } });

    const inscripcion = await obtenerOCrearInscripcionDeVistaPrevia(req.usuario, modulo.idCurso);
    if (!inscripcion) {
      return res.status(403).json({ error: 'No estás inscripto en este curso' });
    }

    // Las clases de video con seguimiento se completan solas al verlas (ver marcarVideoVisto)
    if (contenido.tipo === 'video' && videoConSeguimiento(contenido.urlVideo)) {
      const existente = await prisma.progreso.findUnique({
        where: { idInscripcion_idContenido: { idInscripcion: inscripcion.id, idContenido: contenido.id } },
      });
      if (!existente?.completado) {
        return res.status(409).json({ error: `Tenés que ver al menos el ${PORCENTAJE_MINIMO}% del video`, codigo: 'VIDEO_SIN_VER' });
      }
    }

    await prisma.progreso.upsert({
      where: {
        idInscripcion_idContenido: { idInscripcion: inscripcion.id, idContenido: contenido.id },
      },
      update: { completado: true, fecha: new Date() },
      create: { idInscripcion: inscripcion.id, idContenido: contenido.id, completado: true },
    });

    // Devolvemos ya el resumen actualizado del curso entero (porcentaje, contenidos
    // completados, etc.) en la misma respuesta de "marcar progreso": así el frontend
    // no necesita un segundo pedido GET aparte para refrescar la barra de progreso.
    const resumen = await sincronizarCursoCompleto(inscripcion.id, modulo.idCurso);

    res.json({ ...resumen, ...(await resumenVideos(inscripcion.id)), esVistaPrevia: inscripcion.esVistaPrevia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al marcar el progreso' });
  }
}

async function obtenerProgresoCurso(req, res) {
  try {
    const { cursoId } = req.params;

    const inscripcion = await obtenerOCrearInscripcionDeVistaPrevia(req.usuario, parseInt(cursoId));
    if (!inscripcion) {
      return res.status(403).json({ error: 'No estás inscripto en este curso' });
    }

    const resumen = await calcularResumenProgreso(inscripcion.id, parseInt(cursoId));
    res.json({ ...resumen, ...(await resumenVideos(inscripcion.id)), esVistaPrevia: inscripcion.esVistaPrevia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el progreso' });
  }
}

// Cuánto se vio de cada video del curso (para mostrar el avance de cada clase)
async function resumenVideos(idInscripcion) {
  const filas = await prisma.progreso.findMany({
    where: { idInscripcion, tramosVistos: { not: null } },
    select: { idContenido: true, tramosVistos: true },
  });
  const videosVistos = {};
  filas.forEach((f) => { videosVistos[f.idContenido] = porcentajeVisto(f.tramosVistos); });
  return { videosVistos, porcentajeMinimoVideo: PORCENTAJE_MINIMO, segundosTramo: SEGUNDOS_TRAMO };
}

// El reproductor avisa cada pocos segundos qué tramos se vieron. Al llegar al
// porcentaje mínimo, la clase queda completada.
async function marcarVideoVisto(req, res) {
  try {
    const idContenido = parseInt(req.params.contenidoId);
    const duracion = Number(req.body?.duracion);
    const tramos = Array.isArray(req.body?.tramos) ? req.body.tramos.slice(0, 200) : [];
    if (!(duracion > 0 && duracion <= DURACION_MAXIMA)) {
      return res.status(400).json({ error: 'Duración inválida' });
    }

    const contenido = await prisma.contenido.findUnique({ where: { id: idContenido } });
    if (!contenido || contenido.tipo !== 'video' || !videoConSeguimiento(contenido.urlVideo)) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    const modulo = await prisma.modulo.findUnique({ where: { id: contenido.idModulo } });
    const inscripcion = await obtenerOCrearInscripcionDeVistaPrevia(req.usuario, modulo.idCurso);
    if (!inscripcion) {
      return res.status(403).json({ error: 'No estás inscripto en este curso' });
    }

    const clave = { idInscripcion_idContenido: { idInscripcion: inscripcion.id, idContenido } };
    const anterior = await prisma.progreso.findUnique({ where: clave });
    const ahora = new Date();
    const { tramos: tramosVistos, porcentaje } = sumarTramos({
      tramosAnteriores: anterior?.tramosVistos,
      ultimoAviso: anterior?.ultimoAvisoVideo,
      duracion,
      tramosNuevos: tramos,
      ahora,
    });
    const recienCompletada = !anterior?.completado && porcentaje >= PORCENTAJE_MINIMO;

    await prisma.progreso.upsert({
      where: clave,
      update: {
        tramosVistos, duracionVideo: duracion, ultimoAvisoVideo: ahora,
        ...(recienCompletada ? { completado: true, fecha: ahora } : {}),
      },
      create: {
        idInscripcion: inscripcion.id, idContenido, tramosVistos, duracionVideo: duracion,
        ultimoAvisoVideo: ahora, completado: recienCompletada,
      },
    });

    const resumen = recienCompletada
      ? await sincronizarCursoCompleto(inscripcion.id, modulo.idCurso)
      : await calcularResumenProgreso(inscripcion.id, modulo.idCurso);
    res.json({ ...resumen, ...(await resumenVideos(inscripcion.id)), esVistaPrevia: inscripcion.esVistaPrevia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el avance del video' });
  }
}

module.exports = { marcarProgreso, obtenerProgresoCurso, marcarVideoVisto };

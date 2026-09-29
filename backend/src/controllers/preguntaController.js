const prisma = require('../config/prisma');

async function crearPregunta(req, res) {
  try {
    const { contenidoId } = req.params;
    const {
      enunciado,
      opcionA,
      opcionB,
      opcionC,
      opcionD,
      respuestaCorrecta,
      explicacionA,
      explicacionB,
      explicacionC,
      explicacionD,
    } = req.body;

    if (!enunciado || !opcionA || !opcionB || !opcionC || !opcionD || !respuestaCorrecta) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const opcionesValidas = ['A', 'B', 'C', 'D'];
    if (!opcionesValidas.includes(respuestaCorrecta)) {
      return res.status(400).json({ error: 'respuestaCorrecta debe ser A, B, C o D' });
    }

    const contenido = await prisma.contenido.findUnique({ where: { id: parseInt(contenidoId) } });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    if (contenido.tipo !== 'quiz') {
      return res.status(400).json({ error: 'Solo se pueden agregar preguntas a contenidos de tipo quiz' });
    }

    const nuevaPregunta = await prisma.pregunta.create({
      data: {
        idContenido: parseInt(contenidoId),
        enunciado,
        opcionA,
        opcionB,
        opcionC,
        opcionD,
        respuestaCorrecta,
        explicacionA: explicacionA || null,
        explicacionB: explicacionB || null,
        explicacionC: explicacionC || null,
        explicacionD: explicacionD || null,
      },
    });

    res.status(201).json(nuevaPregunta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la pregunta' });
  }
}

async function listarPreguntasPorContenido(req, res) {
  try {
    const { contenidoId } = req.params;

    const preguntas = await prisma.pregunta.findMany({
      where: { idContenido: parseInt(contenidoId) },
    });

    const preguntasSinRespuesta = preguntas.map(
      ({ respuestaCorrecta, explicacionA, explicacionB, explicacionC, explicacionD, ...resto }) => resto
    );

    res.json(preguntasSinRespuesta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar las preguntas' });
  }
}

async function listarPreguntasAdmin(req, res) {
  try {
    const { contenidoId } = req.params;

    const preguntas = await prisma.pregunta.findMany({
      where: { idContenido: parseInt(contenidoId) },
    });

    res.json(preguntas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar las preguntas' });
  }
}

async function obtenerPregunta(req, res) {
  try {
    const { id } = req.params;
    const pregunta = await prisma.pregunta.findUnique({ where: { id: parseInt(id) } });
    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    res.json(pregunta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la pregunta' });
  }
}

async function editarPregunta(req, res) {
  try {
    const { id } = req.params;
    const {
      enunciado,
      opcionA,
      opcionB,
      opcionC,
      opcionD,
      respuestaCorrecta,
      explicacionA,
      explicacionB,
      explicacionC,
      explicacionD,
    } = req.body;

    const preguntaExistente = await prisma.pregunta.findUnique({ where: { id: parseInt(id) } });
    if (!preguntaExistente) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    const preguntaActualizada = await prisma.pregunta.update({
      where: { id: parseInt(id) },
      data: {
        enunciado,
        opcionA,
        opcionB,
        opcionC,
        opcionD,
        respuestaCorrecta,
        explicacionA,
        explicacionB,
        explicacionC,
        explicacionD,
      },
    });

    res.json(preguntaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar la pregunta' });
  }
}

async function eliminarPregunta(req, res) {
  try {
    const { id } = req.params;

    const preguntaExistente = await prisma.pregunta.findUnique({ where: { id: parseInt(id) } });
    if (!preguntaExistente) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    await prisma.pregunta.delete({ where: { id: parseInt(id) } });

    res.json({ mensaje: 'Pregunta eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la pregunta' });
  }
}

async function responderPregunta(req, res) {
  try {
    const { id } = req.params;
    const { opcionElegida } = req.body;
    const idUsuario = req.usuario.id;

    const opcionesValidas = ['A', 'B', 'C', 'D'];
    if (!opcionesValidas.includes(opcionElegida)) {
      return res.status(400).json({ error: 'opcionElegida debe ser A, B, C o D' });
    }

    const pregunta = await prisma.pregunta.findUnique({ where: { id: parseInt(id) } });
    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    const contenido = await prisma.contenido.findUnique({ where: { id: pregunta.idContenido } });
    const modulo = await prisma.modulo.findUnique({ where: { id: contenido.idModulo } });

    const inscripcion = await prisma.inscripcion.findFirst({
      where: { idUsuario, idCurso: modulo.idCurso },
    });
    if (!inscripcion) {
      return res.status(403).json({ error: 'No estás inscripto en este curso' });
    }

    const esCorrecta = opcionElegida === pregunta.respuestaCorrecta;

    const mapaExplicaciones = {
      A: pregunta.explicacionA,
      B: pregunta.explicacionB,
      C: pregunta.explicacionC,
      D: pregunta.explicacionD,
    };

    res.json({
      correcta: esCorrecta,
      respuestaCorrecta: pregunta.respuestaCorrecta,
      explicacion: mapaExplicaciones[opcionElegida] || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al responder la pregunta' });
  }
}

module.exports = {
  crearPregunta,
  listarPreguntasPorContenido,
  listarPreguntasAdmin,
  obtenerPregunta,
  editarPregunta,
  eliminarPregunta,
  responderPregunta,
};
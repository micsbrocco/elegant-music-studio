const prisma = require('../config/prisma');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');
const { puedeOperarSobreCurso, puedeVerContenidoCurso, idCursoDeBloque, idCursoDePregunta } = require('../utils/permisosCurso');

async function crearPregunta(req, res) {
  try {
    const { bloqueId } = req.params;
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

    if (!enunciado || !opcionA || !opcionB || !respuestaCorrecta) {
      return res.status(400).json({ error: 'El enunciado y al menos las opciones A y B son obligatorios' });
    }

    // opcionC y opcionD son opcionales: una pregunta puede tener 2, 3 o 4 opciones.
    const opcionesPresentes = { A: true, B: true, C: Boolean(opcionC), D: Boolean(opcionD) };
    if (!opcionesPresentes[respuestaCorrecta]) {
      return res.status(400).json({ error: 'respuestaCorrecta debe ser una de las opciones cargadas' });
    }

    const bloque = await prisma.bloque.findUnique({ where: { id: parseInt(bloqueId) } });
    if (!bloque) {
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDeBloque(bloque.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }
    if (bloque.tipo !== 'quiz') {
      return res.status(400).json({ error: 'Solo se pueden agregar preguntas a bloques de tipo quiz' });
    }

    const nuevaPregunta = await prisma.pregunta.create({
      data: {
        idBloque: parseInt(bloqueId),
        enunciado,
        opcionA,
        opcionB,
        opcionC: opcionC || null,
        opcionD: opcionD || null,
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

async function listarPreguntasPorBloque(req, res) {
  try {
    const { bloqueId } = req.params;
    if (!bloqueId || isNaN(parseInt(bloqueId))) {
      return res.status(400).json({ error: 'El id del bloque no es válido' });
    }

    // Solo admin, instructor del curso o alumno inscripto pueden ver las preguntas
    const idCursoBloque = await idCursoDeBloque(parseInt(bloqueId));
    if (!(await puedeVerContenidoCurso(req.usuario, idCursoBloque))) {
      return res.status(403).json({ error: 'No tenés acceso a estas preguntas' });
    }

    const preguntas = await prisma.pregunta.findMany({
      where: { idBloque: parseInt(bloqueId) },
    });

    // Si quien pregunta está logueado, buscamos si ya respondió alguna de
    // estas preguntas antes, para devolvérsela junto con la pregunta y que
    // el frontend no la vuelva a mostrar como "sin responder".
    let respuestasPorPregunta = {};
    if (req.usuario && preguntas.length > 0) {
      const respuestas = await prisma.respuestaPregunta.findMany({
        where: {
          idUsuario: req.usuario.id,
          idPregunta: { in: preguntas.map((p) => p.id) },
        },
      });
      respuestasPorPregunta = Object.fromEntries(respuestas.map((r) => [r.idPregunta, r]));
    }

    const preguntasConEstado = preguntas.map(
      ({ respuestaCorrecta, explicacionA, explicacionB, explicacionC, explicacionD, ...resto }) => {
        const yaRespondida = respuestasPorPregunta[resto.id];
        if (!yaRespondida) return resto;

        const mapaExplicaciones = { A: explicacionA, B: explicacionB, C: explicacionC, D: explicacionD };
        return {
          ...resto,
          yaRespondida: {
            opcionElegida: yaRespondida.opcionElegida,
            correcta: yaRespondida.correcta,
            respuestaCorrecta,
            explicacion: mapaExplicaciones[yaRespondida.opcionElegida] || null,
          },
        };
      }
    );

    res.json(preguntasConEstado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar las preguntas' });
  }
}

async function listarPreguntasAdmin(req, res) {
  try {
    const { bloqueId } = req.params;

    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDeBloque(parseInt(bloqueId))))) {
      return res.status(403).json({ error: 'No podés ver un curso que no es tuyo' });
    }

    const preguntas = await prisma.pregunta.findMany({
      where: { idBloque: parseInt(bloqueId) },
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
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDePregunta(pregunta.id)))) {
      return res.status(403).json({ error: 'No podés ver un curso que no es tuyo' });
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
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDePregunta(preguntaExistente.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    if (!enunciado || !opcionA || !opcionB || !respuestaCorrecta) {
      return res.status(400).json({ error: 'El enunciado y al menos las opciones A y B son obligatorios' });
    }
    const opcionesPresentes = { A: true, B: true, C: Boolean(opcionC), D: Boolean(opcionD) };
    if (!opcionesPresentes[respuestaCorrecta]) {
      return res.status(400).json({ error: 'respuestaCorrecta debe ser una de las opciones cargadas' });
    }

    const preguntaActualizada = await prisma.pregunta.update({
      where: { id: parseInt(id) },
      data: {
        enunciado,
        opcionA,
        opcionB,
        opcionC: opcionC || null,
        opcionD: opcionD || null,
        respuestaCorrecta,
        explicacionA: explicacionA || null,
        explicacionB: explicacionB || null,
        explicacionC: explicacionC || null,
        explicacionD: explicacionD || null,
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
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDePregunta(preguntaExistente.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
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
    if (!pregunta[`opcion${opcionElegida}`]) {
      return res.status(400).json({ error: 'Esa opción no existe para esta pregunta' });
    }

    const bloque = await prisma.bloque.findUnique({ where: { id: pregunta.idBloque } });
    const contenido = await prisma.contenido.findUnique({ where: { id: bloque.idContenido } });
    const modulo = await prisma.modulo.findUnique({ where: { id: contenido.idModulo } });

    let inscripcion = await prisma.inscripcion.findFirst({
      where: { idUsuario, idCurso: modulo.idCurso, ...INSCRIPCION_VIGENTE },
    });
    if (!inscripcion) {
      // Admin o instructor dueño del curso probando el quiz como lo vería un
      // alumno: se les crea una inscripción de vista previa en el momento.
      if (await puedeOperarSobreCurso(req.usuario, modulo.idCurso)) {
        inscripcion = await prisma.inscripcion.create({
          data: { idUsuario, idCurso: modulo.idCurso, esVistaPrevia: true },
        });
      } else {
        return res.status(403).json({ error: 'No estás inscripto en este curso' });
      }
    }

    const esCorrecta = opcionElegida === pregunta.respuestaCorrecta;

    // Guardamos (o actualizamos, si ya había una respuesta previa) la
    // respuesta del alumno, así al volver a entrar a la clase la pregunta
    // se muestra ya respondida en vez de en blanco.
    await prisma.respuestaPregunta.upsert({
      where: { idUsuario_idPregunta: { idUsuario, idPregunta: pregunta.id } },
      update: { opcionElegida, correcta: esCorrecta },
      create: { idUsuario, idPregunta: pregunta.id, opcionElegida, correcta: esCorrecta },
    });

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
  listarPreguntasPorBloque,
  listarPreguntasAdmin,
  obtenerPregunta,
  editarPregunta,
  eliminarPregunta,
  responderPregunta,
};

const prisma = require('../config/prisma');
const { avisarVenta } = require('../utils/avisoVenta');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');

// Comprar un curso (crea Inscripcion + Pago simulado)
async function comprarCurso(req, res) {
  try {
    const { cursoId } = req.body;
    const idUsuario = req.usuario.id; // viene del token

    if (!cursoId) {
      return res.status(400).json({ error: 'El id del curso es obligatorio' });
    }

    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Evitar que se inscriba dos veces al mismo curso
    const inscripcionExistente = await prisma.inscripcion.findFirst({
      where: { idUsuario, idCurso: parseInt(cursoId), ...INSCRIPCION_VIGENTE },
    });
    if (inscripcionExistente) {
      return res.status(409).json({ error: 'Ya estás inscripto en este curso' });
    }

    // Creamos la inscripción y el pago simulado juntos, de forma atómica
    const resultado = await prisma.$transaction(async (tx) => {
      const nuevaInscripcion = await tx.inscripcion.create({
        data: {
          idUsuario,
          idCurso: parseInt(cursoId),
        },
      });

      const nuevoPago = await tx.pago.create({
        data: {
          idInscripcion: nuevaInscripcion.id,
          monto: curso.precio,
          estado: 'simulado_aprobado',
          metodo: 'simulado',
        },
      });

      return { inscripcion: nuevaInscripcion, pago: nuevoPago };
    });

    await avisarVenta(idUsuario, [resultado.pago.id]);
    res.status(201).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la compra' });
  }
}

// Listar los cursos en los que el usuario logueado está inscripto ("Mis cursos")
async function misCursos(req, res) {
  try {
    const idUsuario = req.usuario.id;

    const inscripciones = await prisma.inscripcion.findMany({
      where: { idUsuario, ...INSCRIPCION_VIGENTE },
      include: {
        // Se traen las clases visibles en orden (módulo y clase) para saber por
        // cuál va el alumno, y los avances marcados para saber cuáles ya hizo.
        curso: {
          include: {
            modulos: {
              orderBy: { orden: 'asc' },
              select: {
                titulo: true,
                contenidos: {
                  where: { visible: true },
                  orderBy: { orden: 'asc' },
                  select: { id: true, titulo: true },
                },
              },
            },
          },
        },
        progresos: {
          where: { completado: true },
          select: { idContenido: true, fecha: true },
        },
      },
      orderBy: { fechaInscripcion: 'desc' },
    });

    // A cada inscripción se le suma: total de clases, cuántas completó, cuál es
    // la siguiente que le toca (para "Continuá donde lo dejaste") y la fecha de
    // su último avance. Los módulos no se mandan: el frontend no los necesita acá.
    const resultado = inscripciones.map(({ curso, progresos, ...inscripcion }) => {
      const { modulos, ...datosCurso } = curso;
      const clases = modulos.flatMap((m) =>
        m.contenidos.map((c) => ({ id: c.id, titulo: c.titulo, modulo: m.titulo }))
      );
      const hechas = new Set(progresos.map((p) => p.idContenido));
      const clasesCompletadas = clases.filter((c) => hechas.has(c.id)).length;
      const indiceSiguiente = clases.findIndex((c) => !hechas.has(c.id));
      const ultimaActividad = progresos.reduce(
        (masReciente, p) => (!masReciente || p.fecha > masReciente ? p.fecha : masReciente),
        null
      );

      return {
        ...inscripcion,
        curso: datosCurso,
        totalClases: clases.length,
        clasesCompletadas,
        siguienteClase: indiceSiguiente >= 0
          ? { ...clases[indiceSiguiente], numero: indiceSiguiente + 1 }
          : null,
        ultimaActividad,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tus cursos' });
  }
}

// Verificar si el usuario logueado está inscripto en un curso puntual
async function verificarInscripcion(req, res) {
  try {
    const { cursoId } = req.params;
    const idUsuario = req.usuario.id;

    const inscripcion = await prisma.inscripcion.findFirst({
      where: { idUsuario, idCurso: parseInt(cursoId), ...INSCRIPCION_VIGENTE },
    });

    res.json({ inscripto: Boolean(inscripcion), inscripcion: inscripcion || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar la inscripción' });
  }
}

module.exports = { comprarCurso, misCursos, verificarInscripcion };
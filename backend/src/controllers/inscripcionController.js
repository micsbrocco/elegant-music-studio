const prisma = require('../config/prisma');

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
      where: { idUsuario, idCurso: parseInt(cursoId) },
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
      where: { idUsuario },
      include: { curso: true },
      orderBy: { fechaInscripcion: 'desc' },
    });

    res.json(inscripciones);
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
      where: { idUsuario, idCurso: parseInt(cursoId) },
    });

    res.json({ inscripto: Boolean(inscripcion), inscripcion: inscripcion || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar la inscripción' });
  }
}

module.exports = { comprarCurso, misCursos, verificarInscripcion };
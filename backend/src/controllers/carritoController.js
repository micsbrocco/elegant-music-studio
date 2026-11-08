const prisma = require('../config/prisma');
const { avisarVenta } = require('../utils/avisoVenta');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');

async function agregarAlCarrito(req, res) {
  try {
    const { cursoId } = req.body;
    const idUsuario = req.usuario.id;

    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Si ya está inscripto, no tiene sentido agregarlo al carrito
    const yaInscripto = await prisma.inscripcion.findFirst({
      where: { idUsuario, idCurso: parseInt(cursoId), ...INSCRIPCION_VIGENTE },
    });
    if (yaInscripto) {
      return res.status(409).json({ error: 'Ya estás inscripto en este curso' });
    }

    const item = await prisma.carritoItem.create({
      data: { idUsuario, idCurso: parseInt(cursoId) },
    });

    res.status(201).json(item);
  } catch (error) {
    if (error.code === 'P2002') {
      // Violación de la restricción @@unique: ya estaba en el carrito
      return res.status(409).json({ error: 'Este curso ya está en tu carrito' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
}

async function verCarrito(req, res) {
  try {
    const idUsuario = req.usuario.id;

    const items = await prisma.carritoItem.findMany({
      where: { idUsuario },
      include: { curso: true },
      orderBy: { fechaAgregado: 'desc' },
    });

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
}

async function quitarDelCarrito(req, res) {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;

    const item = await prisma.carritoItem.findUnique({ where: { id: parseInt(id) } });
    if (!item || item.idUsuario !== idUsuario) {
      return res.status(404).json({ error: 'Ítem no encontrado en tu carrito' });
    }

    await prisma.carritoItem.delete({ where: { id: parseInt(id) } });
    res.json({ mensaje: 'Ítem eliminado del carrito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al quitar del carrito' });
  }
}

// Compra todos los cursos que están en el carrito (crea Inscripcion + Pago por cada uno)
async function comprarCarrito(req, res) {
  try {
    const idUsuario = req.usuario.id;

    const items = await prisma.carritoItem.findMany({
      where: { idUsuario },
      include: { curso: true },
    });

    if (items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const inscripcionesCreadas = [];

      for (const item of items) {
        // Evitamos duplicar si por algún motivo ya está inscripto
        const yaInscripto = await tx.inscripcion.findFirst({
          where: { idUsuario, idCurso: item.idCurso },
        });
        if (yaInscripto) continue;

        const nuevaInscripcion = await tx.inscripcion.create({
          data: { idUsuario, idCurso: item.idCurso },
        });

        const nuevoPago = await tx.pago.create({
          data: {
            idInscripcion: nuevaInscripcion.id,
            monto: item.curso.precio,
            estado: 'simulado_aprobado',
            metodo: 'simulado',
          },
        });

        inscripcionesCreadas.push({ ...nuevaInscripcion, idPago: nuevoPago.id });
      }

      // Vaciamos el carrito una vez procesada la compra
      await tx.carritoItem.deleteMany({ where: { idUsuario } });

      return inscripcionesCreadas;
    });

    await avisarVenta(idUsuario, resultado.map((i) => i.idPago));
    res.status(201).json({ mensaje: 'Compra realizada correctamente', inscripciones: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la compra del carrito' });
  }
}

module.exports = { agregarAlCarrito, verCarrito, quitarDelCarrito, comprarCarrito };
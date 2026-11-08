const prisma = require('../config/prisma');
const { puedeOperarSobreCurso, idCursoDeContenido, idCursoDeBloque } = require('../utils/permisosCurso');
const { limpiarHtml } = require('../utils/htmlSeguro');

// Máximo de bloques que puede tener una clase.
const MAX_BLOQUES_POR_CLASE = 3;

// Admin, o instructor dueño del curso: agrega un bloque (texto o quiz) al
// final de una clase de tipo "bloques".
async function crearBloque(req, res) {
  try {
    const { contenidoId } = req.params;
    const { tipo } = req.body;

    const tiposValidos = ['texto', 'quiz'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de bloque inválido. Debe ser: texto o quiz' });
    }

    const contenido = await prisma.contenido.findUnique({ where: { id: parseInt(contenidoId) } });
    if (!contenido) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDeContenido(contenido.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }
    if (contenido.tipo !== 'bloques') {
      return res.status(400).json({ error: 'Solo se pueden agregar bloques a una clase de tipo "bloques"' });
    }

    const cantidadBloques = await prisma.bloque.count({ where: { idContenido: contenido.id } });
    if (cantidadBloques >= MAX_BLOQUES_POR_CLASE) {
      return res.status(400).json({ error: `Una clase puede tener como máximo ${MAX_BLOQUES_POR_CLASE} bloques` });
    }

    const ultimoBloque = await prisma.bloque.findFirst({
      where: { idContenido: contenido.id },
      orderBy: { orden: 'desc' },
    });

    const nuevoBloque = await prisma.bloque.create({
      data: {
        idContenido: contenido.id,
        tipo,
        orden: (ultimoBloque?.orden || 0) + 1,
        contenidoTexto: tipo === 'texto' ? '' : null,
      },
    });

    res.status(201).json(nuevoBloque);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el bloque' });
  }
}

// Solo admin: edita el contenido de texto de un bloque de tipo "texto". Los
// bloques de quiz no tienen contenido propio para editar acá (sus preguntas
// se manejan con los endpoints de /bloques/:bloqueId/preguntas).
async function editarBloque(req, res) {
  try {
    const { id } = req.params;
    const { contenidoTexto } = req.body;

    const bloque = await prisma.bloque.findUnique({ where: { id: parseInt(id) } });
    if (!bloque) {
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDeBloque(bloque.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }
    if (bloque.tipo !== 'texto') {
      return res.status(400).json({ error: 'Solo los bloques de texto se editan por acá' });
    }

    const bloqueActualizado = await prisma.bloque.update({
      where: { id: parseInt(id) },
      data: { contenidoTexto: limpiarHtml(contenidoTexto) || '' },
    });

    res.json(bloqueActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el bloque' });
  }
}

// Solo admin: elimina un bloque (y, en cascada, sus preguntas si era de quiz).
async function eliminarBloque(req, res) {
  try {
    const { id } = req.params;

    const bloque = await prisma.bloque.findUnique({ where: { id: parseInt(id) } });
    if (!bloque) {
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDeBloque(bloque.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    await prisma.bloque.delete({ where: { id: parseInt(id) } });

    res.json({ mensaje: 'Bloque eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el bloque' });
  }
}

// Solo admin: reordena en un solo pedido todos los bloques de una clase (drag & drop).
async function reordenarBloquesLote(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se necesita un array de ids' });
    }

    const idCurso = await idCursoDeBloque(parseInt(ids[0]));
    if (!(await puedeOperarSobreCurso(req.usuario, idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    await prisma.$transaction(
      ids.map((id, indice) =>
        prisma.bloque.update({ where: { id: parseInt(id) }, data: { orden: indice + 1 } })
      )
    );

    res.json({ mensaje: 'Bloques reordenados correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reordenar los bloques' });
  }
}

module.exports = {
  crearBloque,
  editarBloque,
  eliminarBloque,
  reordenarBloquesLote,
};

const prisma = require('../config/prisma');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');
const supabase = require('../config/supabase');
const { puedeOperarSobreCurso, puedeVerContenidoCurso, idCursoDeContenido } = require('../utils/permisosCurso');
const { limpiarHtml } = require('../utils/htmlSeguro');

// Bucket privado de Supabase para material de clases (PDFs, ZIPs, audio, etc.): a diferencia
// de "perfiles" (fotos de portada y de perfil, público), este bucket NO es público. El acceso
// a cada archivo se resuelve siempre generando una URL firmada de corta duración, y solo para
// un admin o un alumno inscripto en el curso correspondiente.
const BUCKET_MATERIAL = 'material-cursos';
const DURACION_URL_FIRMADA = 300; // 5 minutos

// Valida y limpia la lista de archivos adjuntos que llega del editor: solo se
// aceptan entradas con una url real, y a cada una se le asigna su orden.
function normalizarArchivos(archivos) {
  if (!Array.isArray(archivos)) return [];
  return archivos
    .filter((a) => a && typeof a.url === 'string' && a.url.trim())
    .map((a, i) => ({
      url: a.url.trim(),
      nombre: (a.nombre && String(a.nombre).trim()) || a.url.split('/').pop(),
      orden: i,
    }));
}

async function crearContenido(req, res) {
  try {
    const { moduloId } = req.params;
    const { titulo, orden, tipo, visible, contenidoTexto, urlVideo, archivos } = req.body;

    if (!titulo || orden === undefined || !tipo) {
      return res.status(400).json({ error: 'Título, orden y tipo son obligatorios' });
    }

    // Una clase es "video" (con su propio reproductor, notas y archivos) o
    // "bloques" (una lista ordenada de bloques de texto y/o quiz armada por el
    // admin). El tipo se elige al crear la clase y no se puede cambiar después.
    const tiposValidos = ['video', 'bloques'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Debe ser: video o bloques' });
    }

    const modulo = await prisma.modulo.findUnique({ where: { id: parseInt(moduloId) } });
    if (!modulo) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, modulo.idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    const archivosNormalizados = normalizarArchivos(archivos);

    const nuevoContenido = await prisma.contenido.create({
      data: {
        idModulo: parseInt(moduloId),
        titulo,
        orden,
        tipo,
        visible: visible !== false,
        contenidoTexto: tipo === 'video' ? (limpiarHtml(contenidoTexto) || null) : null,
        urlVideo: tipo === 'video' ? (urlVideo || null) : null,
        archivos: archivosNormalizados.length ? { create: archivosNormalizados } : undefined,
      },
      include: { archivos: { orderBy: { orden: 'asc' } }, bloques: true },
    });

    res.status(201).json(nuevoContenido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el contenido' });
  }
}

async function obtenerContenido(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del contenido no es válido' });
    }
    // Nota: esta ruta pide token y valida acceso al curso. Igual NO
    // incluimos las preguntas de los bloques de quiz (tienen la respuesta correcta):
    // esas se piden aparte por los endpoints de /bloques/:id/preguntas, que sí
    // controlan permisos. Esto solo da la estructura (bloques y su orden/tipo).
    const contenido = await prisma.contenido.findUnique({
      where: { id: parseInt(id) },
      include: {
        archivos: { orderBy: { orden: 'asc' } },
        bloques: { orderBy: { orden: 'asc' } },
      },
    });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    // Solo admin, instructor del curso o alumno inscripto pueden ver la clase
    const idCursoContenido = await idCursoDeContenido(contenido.id);
    if (!(await puedeVerContenidoCurso(req.usuario, idCursoContenido))) {
      return res.status(403).json({ error: 'No tenés acceso a este contenido' });
    }
    // Una clase oculta no le llega al alumno
    if (contenido.visible === false && !(await puedeOperarSobreCurso(req.usuario, idCursoContenido))) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    if ((!contenido.archivos || contenido.archivos.length === 0) && contenido.archivoDescargable) {
      contenido.archivos = [{
        id: `legacy-${contenido.id}`,
        url: contenido.archivoDescargable,
        nombre: contenido.nombreArchivo || 'Archivo adjunto',
        orden: 0,
      }];
    }
    res.json(contenido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el contenido' });
  }
}

async function editarContenido(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del contenido no es válido' });
    }
    const { titulo, orden, visible, tipo, contenidoTexto, urlVideo, archivos } = req.body;

    const contenidoExistente = await prisma.contenido.findUnique({ where: { id: parseInt(id) } });
    if (!contenidoExistente) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    const idCursoDeEste = await idCursoDeContenido(contenidoExistente.id);
    if (!(await puedeOperarSobreCurso(req.usuario, idCursoDeEste))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    const archivosNormalizados = normalizarArchivos(archivos);

    // El tipo ("video" o "bloques") se puede cambiar desde el editor. Cambiar
    // el tipo no borra nada: ni los bloques, ni las notas, ni la URL del video;
    // solo dejan de mostrarse, por si el admin vuelve a cambiar el tipo.
    const tiposValidos = ['video', 'bloques'];
    const tipoFinal = tiposValidos.includes(tipo) ? tipo : contenidoExistente.tipo;

    // La lista de archivos se reemplaza entera en cada guardado (se borran los
    // viejos y se cargan los nuevos), que es como el editor maneja el formulario.
    const [, , contenidoActualizado] = await prisma.$transaction([
      prisma.contenido.update({
        where: { id: parseInt(id) },
        data: {
          titulo,
          orden,
          visible: visible !== false,
          tipo: tipoFinal,
          // Las notas y la URL del video se conservan aunque la clase pase a
          // "bloques": solo dejan de mostrarse, así cambiar de pestaña en el
          // editor y guardar no borra lo que ya estaba cargado.
          contenidoTexto: contenidoTexto !== undefined ? (limpiarHtml(contenidoTexto) || null) : contenidoExistente.contenidoTexto,
          urlVideo: urlVideo !== undefined ? (urlVideo || null) : contenidoExistente.urlVideo,
          // Las columnas legacy quedan en null: a partir de ahora los archivos
          // viven únicamente en la tabla ArchivoContenido.
          archivoDescargable: null,
          nombreArchivo: null,
        },
      }),
      prisma.archivoContenido.deleteMany({ where: { idContenido: parseInt(id) } }),
      prisma.contenido.update({
        where: { id: parseInt(id) },
        data: {
          archivos: archivosNormalizados.length ? { create: archivosNormalizados } : undefined,
        },
        include: { archivos: { orderBy: { orden: 'asc' } } },
      }),
    ]);

    res.json(contenidoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el contenido' });
  }
}

// Solo admin: mueve una clase a otro módulo (drag & drop entre módulos en el
// editor). Valida que el módulo destino sea del mismo curso, para no mezclar
// contenido entre cursos distintos por error.
async function moverContenido(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del contenido no es válido' });
    }
    const { idModulo, orden } = req.body;
    if (!idModulo || isNaN(parseInt(idModulo))) {
      return res.status(400).json({ error: 'El id del módulo destino no es válido' });
    }

    const contenido = await prisma.contenido.findUnique({
      where: { id: parseInt(id) },
      include: { modulo: true },
    });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, contenido.modulo.idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    const moduloDestino = await prisma.modulo.findUnique({ where: { id: parseInt(idModulo) } });
    if (!moduloDestino) {
      return res.status(404).json({ error: 'Módulo destino no encontrado' });
    }
    if (moduloDestino.idCurso !== contenido.modulo.idCurso) {
      return res.status(400).json({ error: 'El módulo destino no pertenece al mismo curso' });
    }

    const contenidoActualizado = await prisma.contenido.update({
      where: { id: parseInt(id) },
      data: {
        idModulo: parseInt(idModulo),
        orden: orden === undefined ? contenido.orden : orden,
      },
    });

    res.json(contenidoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al mover la clase de módulo' });
  }
}

async function eliminarContenido(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del contenido no es válido' });
    }

    const contenidoExistente = await prisma.contenido.findUnique({ where: { id: parseInt(id) } });
    if (!contenidoExistente) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDeContenido(contenidoExistente.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    // Las respuestas de los quizzes no tienen borrado en cascada: se borran primero
    await prisma.$transaction([
      prisma.respuestaPregunta.deleteMany({
        where: { pregunta: { bloque: { idContenido: parseInt(id) } } },
      }),
      prisma.contenido.delete({ where: { id: parseInt(id) } }),
    ]);

    res.json({ mensaje: 'Contenido eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el contenido' });
  }
}

async function reordenarContenido(req, res) {
  try {
    const { id } = req.params;
    const { direccion } = req.body;

    const contenido = await prisma.contenido.findUnique({ where: { id: parseInt(id) } });
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    if (!(await puedeOperarSobreCurso(req.usuario, await idCursoDeContenido(contenido.id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    const vecino = await prisma.contenido.findFirst({
      where: {
        idModulo: contenido.idModulo,
        orden: direccion === 'subir' ? { lt: contenido.orden } : { gt: contenido.orden },
      },
      orderBy: { orden: direccion === 'subir' ? 'desc' : 'asc' },
    });

    if (!vecino) {
      return res.status(400).json({ error: 'El contenido ya está en un extremo, no se puede mover más' });
    }

    await prisma.$transaction([
      prisma.contenido.update({ where: { id: contenido.id }, data: { orden: vecino.orden } }),
      prisma.contenido.update({ where: { id: vecino.id }, data: { orden: contenido.orden } }),
    ]);

    res.json({ mensaje: 'Contenido reordenado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reordenar el contenido' });
  }
}

// Reordena en un solo pedido una lista completa de contenidos (drag & drop del editor de curso)
async function reordenarContenidosLote(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se necesita un array de ids' });
    }

    // Todo el lote pertenece a un solo módulo/curso: alcanza con validar el primero.
    const idCurso = await idCursoDeContenido(parseInt(ids[0]));
    if (!(await puedeOperarSobreCurso(req.usuario, idCurso))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    await prisma.$transaction(
      ids.map((id, indice) =>
        prisma.contenido.update({ where: { id: parseInt(id) }, data: { orden: indice + 1 } })
      )
    );

    res.json({ mensaje: 'Contenidos reordenados correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reordenar los contenidos' });
  }
}

// Solo admin: sube un archivo descargable para una clase (PDF, ZIP, audio, video, Word, etc.)
// a un bucket PRIVADO de Supabase. Se guarda solo la ruta interna (no una URL pública): el
// acceso real se resuelve siempre después, mediante una URL firmada, verificando quién pide el
// archivo (ver obtenerUrlArchivo / firmarUrlArchivoAdmin más abajo).
async function subirArchivoLeccion(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const extension = req.file.originalname.split('.').pop();
    const ruta = `leccion-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_MATERIAL)
      .upload(ruta, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (errorSubida) {
      console.error(errorSubida);
      return res.status(500).json({ error: 'Error al subir el archivo' });
    }

    res.json({ url: ruta, nombre: req.file.originalname });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
}

// Solo admin: genera una URL firmada temporal a partir de la ruta interna de un archivo, para
// poder previsualizarlo desde el editor incluso antes de guardar la clase (todavía no tiene
// fila propia en ArchivoContenido en ese momento, así que no se puede pedir por id).
async function firmarUrlArchivoAdmin(req, res) {
  try {
    const { ruta } = req.body;
    if (!ruta) {
      return res.status(400).json({ error: 'La ruta del archivo es obligatoria' });
    }

    // Archivos viejos subidos antes de este cambio: son una URL pública completa, no una ruta.
    if (/^https?:\/\//.test(ruta)) {
      return res.json({ url: ruta });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_MATERIAL)
      .createSignedUrl(ruta, DURACION_URL_FIRMADA);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al generar el enlace del archivo' });
    }

    res.json({ url: data.signedUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el enlace del archivo' });
  }
}

// Admin o alumno inscripto en el curso: genera una URL firmada temporal para descargar un
// archivo ya guardado de una clase. Verifica la inscripción antes de firmar nada.
async function obtenerUrlArchivo(req, res) {
  try {
    const { archivoId } = req.params;
    if (!archivoId || isNaN(parseInt(archivoId))) {
      return res.status(400).json({ error: 'El id del archivo no es válido' });
    }

    const archivo = await prisma.archivoContenido.findUnique({
      where: { id: parseInt(archivoId) },
      include: { contenido: { include: { modulo: true } } },
    });
    if (!archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const idCurso = archivo.contenido.modulo.idCurso;
    const esAdmin = req.usuario.rol === 'admin';
    if (!esAdmin && !(await puedeOperarSobreCurso(req.usuario, idCurso))) {
      const inscripcion = await prisma.inscripcion.findFirst({
        where: { idUsuario: req.usuario.id, idCurso, ...INSCRIPCION_VIGENTE },
      });
      if (!inscripcion) {
        return res.status(403).json({ error: 'Necesitás estar inscripto en este curso para acceder al archivo' });
      }
    }

    // Archivos viejos subidos antes de este cambio: son una URL pública completa, no una ruta.
    if (/^https?:\/\//.test(archivo.url)) {
      return res.json({ url: archivo.url });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_MATERIAL)
      .createSignedUrl(archivo.url, DURACION_URL_FIRMADA);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al generar el enlace del archivo' });
    }

    res.json({ url: data.signedUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el archivo' });
  }
}

module.exports = {
  crearContenido,
  obtenerContenido,
  editarContenido,
  moverContenido,
  eliminarContenido,
  reordenarContenido,
  reordenarContenidosLote,
  subirArchivoLeccion,
  firmarUrlArchivoAdmin,
  obtenerUrlArchivo,
};
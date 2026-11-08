const prisma = require('../config/prisma');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');
const supabase = require('../config/supabase');
const { puedeOperarSobreCurso } = require('../utils/permisosCurso');
const { notificar, escapar } = require('../utils/notificar');
const { instructoresDelCurso } = require('../utils/instructoresCurso');

// Antes de dejar un curso "activo" (visible en el catálogo), nos aseguramos de que
// ningún bloque de quiz (dentro de una clase de tipo "bloques") haya quedado sin
// preguntas cargadas: un alumno no podría avanzar/emitir certificado de forma
// consistente con un quiz vacío.
async function buscarQuizSinPreguntas(idCurso) {
  const bloqueVacio = await prisma.bloque.findFirst({
    where: {
      tipo: 'quiz',
      // Una clase oculta (visible: false) no le llega al alumno, así que un quiz
      // vacío ahí no debería trabar la activación del curso. Tampoco cuenta un
      // bloque de quiz "huérfano" que quedó de cuando la clase era de tipo
      // "bloques" y después se cambió a "video": ya no se le muestra al alumno.
      contenido: { modulo: { idCurso }, visible: true, tipo: 'bloques' },
      preguntas: { none: {} },
    },
    select: { contenido: { select: { titulo: true } } },
  });
  return bloqueVacio ? { titulo: bloqueVacio.contenido.titulo } : null;
}

// Crear un curso (admin, o instructor creando uno propio)
// Lo mínimo que tiene que tener un curso para publicarse. Devuelve una lista
// de frases ("Falta la descripción.") vacía si está todo bien. El editor muestra
// la misma lista antes de publicar, pero se vuelve a revisar acá por seguridad.
async function faltantesParaPublicar(idCurso) {
  const curso = await prisma.curso.findUnique({
    where: { id: idCurso },
    select: {
      titulo: true,
      descripcion: true,
      precio: true,
      categoria: true,
      modulos: { select: { contenidos: { where: { visible: true }, select: { id: true } } } },
    },
  });
  const faltantes = [];
  if (!curso.titulo?.trim()) faltantes.push('Falta el título.');
  if (!curso.descripcion?.trim()) faltantes.push('Falta la descripción.');
  if (!curso.categoria?.trim()) faltantes.push('Falta la categoría.');
  if (!(Number(curso.precio) > 0)) faltantes.push('Falta el precio.');
  const clasesVisibles = curso.modulos.reduce((n, m) => n + m.contenidos.length, 0);
  if (clasesVisibles === 0) faltantes.push('Tiene que tener al menos una clase visible.');
  const quizVacio = await buscarQuizSinPreguntas(idCurso);
  if (quizVacio) faltantes.push(`La clase "${quizVacio.titulo}" tiene un quiz sin preguntas.`);
  return faltantes;
}

async function crearCurso(req, res) {
  try {
    const {
      titulo, descripcion, precio, categoria, imagenPortada,
      nivel, precioOriginal, incluye, estadisticas, estado, emiteCertificado,
    } = req.body;

    // Para crear alcanza con título y categoría: el resto se completa después
    // en el editor (que guarda solo). Todo curso nuevo nace en borrador y se
    // publica recién cuando está completo (ver cambiarEstadoCurso).
    if (!titulo?.trim() || !categoria?.trim()) {
      return res.status(400).json({ error: 'El título y la categoría son obligatorios' });
    }

    const nuevoCurso = await prisma.curso.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion || '',
        precio: precio || 0,
        categoria: categoria.trim(),
        imagenPortada: imagenPortada || null,
        nivel: nivel || null,
        precioOriginal: precioOriginal || null,
        incluye: incluye || [],
        estadisticas: estadisticas || null,
        estado: 'borrador',
        emiteCertificado: emiteCertificado === undefined ? true : Boolean(emiteCertificado),
        idAdminCreador: req.usuario.id,
        // Quien crea el curso queda de entrada como instructor visible en su
        // página pública; desde "Instructores y colaboradores" se puede
        // ocultar, agregar a otras personas, o reordenar.
        colaboradores: {
          create: { idUsuario: req.usuario.id, visible: true, orden: 0 },
        },
      },
    });

    res.status(201).json(nuevoCurso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el curso' });
  }
}

// Listar cursos activos (público, para el catálogo)
async function listarCursos(req, res) {
  try {
    const cursos = await prisma.curso.findMany({
      where: { estado: 'activo' },
      orderBy: { id: 'desc' },
    });
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar cursos' });
  }
}

// Listar TODOS los cursos sin importar su estado (admin para el panel; un
// instructor solo ve los que creó él mismo, donde el admin lo designó, o
// donde lo agregaron como editor/colaborador)
async function listarCursosAdmin(req, res) {
  try {
    const esInstructor = req.usuario.rol === 'profesor';

    // ?estado=archivado trae solo los archivados; sin parámetro (o con otro
    // estado) los archivados quedan afuera de la lista principal.
    const { estado, categoria } = req.query;
    const filtroEstado = estado === 'archivado'
      ? { estado: 'archivado' }
      : estado && ['activo', 'oculto', 'borrador'].includes(estado)
        ? { estado }
        : { estado: { not: 'archivado' } };

    const cursos = await prisma.curso.findMany({
      where: {
        ...filtroEstado,
        ...(categoria ? { categoria } : {}),
        ...(esInstructor
          ? {
            OR: [
              { idAdminCreador: req.usuario.id },
              { colaboradores: { some: { idUsuario: req.usuario.id } } },
            ],
          }
          : {}),
      },
      // No contamos las inscripciones de "vista previa" (admin/instructor viendo su
      // propio curso como alumno): no son ventas reales, no deberían figurar acá.
      include: { _count: { select: { inscripciones: { where: { esVistaPrevia: false } } } } },
      orderBy: { id: 'desc' },
      // ?limite=3 para las vistas previas (por ejemplo, el Resumen)
      ...(parseInt(req.query.limite) > 0 ? { take: Math.min(50, parseInt(req.query.limite)) } : {}),
    });
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar los cursos' });
  }
}

// Categorías que ya se usan (para elegir al crear un curso, sin traer los cursos)
async function listarCategorias(req, res) {
  try {
    const filas = await prisma.curso.findMany({
      where: { estado: { not: 'archivado' } },
      distinct: ['categoria'],
      select: { categoria: true },
      orderBy: { categoria: 'asc' },
    });
    res.json(filas.map((f) => f.categoria).filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar las categorías' });
  }
}

// Ver el detalle de un curso puntual (público)
async function obtenerCurso(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del curso no es válido' });
    }

    const curso = await prisma.curso.findUnique({
      where: { id: parseInt(id) },
      include: {
        modulos: {
          orderBy: { orden: 'asc' },
          include: {
            contenidos: {
              orderBy: { orden: 'asc' },
              include: {
                archivos: { orderBy: { orden: 'asc' } },
                // Sin las preguntas acá (tienen la respuesta correcta): esas se piden
                // aparte por /bloques/:id/preguntas, que sí valida permisos.
                bloques: { orderBy: { orden: 'asc' } },
              },
            },
          },
        },
        adminCreador: {
          select: { nombre: true, apellido: true, descripcion: true, fotoPerfil: true },
        },
        colaboradores: {
          orderBy: { orden: 'asc' },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, descripcion: true, fotoPerfil: true, rol: true },
            },
          },
        },
      },
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Quién pide el curso: admin, el instructor dueño del curso y alumnos inscriptos
    // ven el contenido real de las clases; cualquier otro visitante (sin cuenta, o
    // logueado pero sin haber comprado el curso) solo ve la vidriera (título/orden/
    // tipo de cada clase), sin texto, video ni archivos.
    const esAdmin = req.usuario?.rol === 'admin';
    const esInstructorPropietario = req.usuario?.rol === 'profesor'
      && (curso.idAdminCreador === req.usuario.id
        || curso.colaboradores.some((c) => c.idUsuario === req.usuario.id));

    // Instructores a mostrar en la página pública: los colaboradores marcados
    // como visibles, en el orden elegido desde el editor. Si el curso no tiene
    // ninguno visible (cursos viejos, de antes de que existiera esta lista) se
    // muestra al creador como instructor único, igual que antes.
    const colaboradoresVisibles = curso.colaboradores.filter((c) => c.visible);
    curso.instructoresVisibles = (colaboradoresVisibles.length > 0
      ? colaboradoresVisibles
      : [{ etiqueta: null, usuario: curso.adminCreador }]
    ).map((c) => ({ etiqueta: c.etiqueta, usuario: c.usuario }));
    // La revisión (pedido de publicación y comentario del admin) es interna
    if (!esAdmin && !esInstructorPropietario) {
      delete curso.revisionSolicitadaEn;
      delete curso.comentarioRevision;
    }
    let tieneAccesoCompleto = esAdmin || esInstructorPropietario;
    if (!tieneAccesoCompleto && req.usuario) {
      const inscripcion = await prisma.inscripcion.findFirst({
        where: { idUsuario: req.usuario.id, idCurso: curso.id, ...INSCRIPCION_VIGENTE },
      });
      tieneAccesoCompleto = Boolean(inscripcion);
    }

    if (tieneAccesoCompleto) {
      // Una clase marcada como no visible no le llega al alumno (no cuenta para su
      // progreso ni para el certificado): se la sacamos de la lista antes de nada.
      // El admin y el instructor dueño siguen viendo todas, visibles y ocultas,
      // para poder editarlas.
      // Compatibilidad con clases viejas que todavía tienen un solo archivo guardado
      // en las columnas legacy (archivoDescargable/nombreArchivo) en vez de en la
      // tabla de ArchivoContenido: se lo mostramos igual como si fuera parte de la lista.
      curso.modulos.forEach((modulo) => {
        if (!esAdmin && !esInstructorPropietario) {
          modulo.contenidos = modulo.contenidos.filter((c) => c.visible);
        }
        modulo.contenidos.forEach((contenido) => {
          if ((!contenido.archivos || contenido.archivos.length === 0) && contenido.archivoDescargable) {
            contenido.archivos = [{
              id: `legacy-${contenido.id}`,
              url: contenido.archivoDescargable,
              nombre: contenido.nombreArchivo || 'Archivo adjunto',
              orden: 0,
            }];
          }
        });
      });
    } else {
      curso.modulos.forEach((modulo) => {
        modulo.contenidos = modulo.contenidos
          .filter((c) => c.visible)
          .map((contenido) => ({
            id: contenido.id,
            idModulo: contenido.idModulo,
            titulo: contenido.titulo,
            orden: contenido.orden,
            tipo: contenido.tipo,
          }));
      });
    }

    res.json(curso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el curso' });
  }
}

// Editar un curso (admin, o el instructor dueño de ese curso puntual)
async function editarCurso(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del curso no es válido' });
    }
    const {
      titulo, descripcion, precio, categoria, imagenPortada,
      nivel, precioOriginal, incluye, estadisticas, estado, emiteCertificado,
    } = req.body;

    const cursoExistente = await prisma.curso.findUnique({ where: { id: parseInt(id) } });
    if (!cursoExistente) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const esInstructor = req.usuario.rol === 'profesor';
    if (esInstructor && !(await puedeOperarSobreCurso(req.usuario, parseInt(id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    // Un instructor no puede publicar/ocultar el curso: ese campo queda
    // congelado tal como estaba, pase lo que pase en el body de la petición.
    // Eso es trabajo exclusivo del admin, desde "Gestionar Cursos".
    // Si no viene un estado (el editor guarda solo y no lo manda), queda el que tenía.
    const estadoFinal = esInstructor ? cursoExistente.estado : (estado || cursoExistente.estado);

    if (estadoFinal === 'activo' && cursoExistente.estado !== 'activo') {
      const faltantes = await faltantesParaPublicar(parseInt(id));
      if (faltantes.length > 0) {
        return res.status(400).json({ error: `No se puede publicar todavía: ${faltantes.join(' ')}`, faltantes });
      }
    }

    const cursoActualizado = await prisma.curso.update({
      where: { id: parseInt(id) },
      data: {
        titulo,
        descripcion,
        precio,
        categoria,
        imagenPortada: imagenPortada || null,
        nivel: nivel || null,
        precioOriginal: precioOriginal || null,
        incluye: incluye || [],
        estadisticas: estadisticas || null,
        estado: estadoFinal,
        archivadoEn: estadoFinal === 'archivado' ? (cursoExistente.archivadoEn || new Date()) : null,
        emiteCertificado: emiteCertificado === undefined ? cursoExistente.emiteCertificado : Boolean(emiteCertificado),
        // Ya no se pisa idAdminCreador en cada edición: si el admin corrige un
        // curso que armó un instructor, el instructor tiene que seguir
        // figurando como su creador (y seguir pudiendo editarlo después).
      },
    });

    res.json(cursoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el curso' });
  }
}

// Cambiar solo el estado del curso - solo admin.
//  activo    → publicado en el catálogo
//  oculto    → ya se publicó, pero por ahora no se muestra
//  borrador  → en preparación, todavía no se lanzó
//  archivado → borrado lógico: sale de todas las listas, se puede restaurar.
//              Los alumnos que lo compraron siguen teniendo acceso.
async function cambiarEstadoCurso(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del curso no es válido' });
    }
    const { estado } = req.body;

    const estadosValidos = ['activo', 'oculto', 'borrador', 'archivado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Debe ser: activo, oculto, borrador o archivado' });
    }

    const cursoExistente = await prisma.curso.findUnique({ where: { id: parseInt(id) } });
    if (!cursoExistente) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    if (estado === 'activo' && cursoExistente.estado !== 'activo') {
      const faltantes = await faltantesParaPublicar(parseInt(id));
      if (faltantes.length > 0) {
        return res.status(400).json({ error: `No se puede publicar todavía: ${faltantes.join(' ')}`, faltantes });
      }
    }

    const publicandoRevision = estado === 'activo' && cursoExistente.revisionSolicitadaEn;
    const cursoActualizado = await prisma.curso.update({
      where: { id: parseInt(id) },
      data: {
        estado,
        // Se guarda cuándo se archivó (para el borrado automático de los que no
        // tienen ventas); al restaurarlo se limpia.
        archivadoEn: estado === 'archivado' ? (cursoExistente.archivadoEn || new Date()) : null,
        // Al publicarse, la revisión pendiente queda resuelta
        ...(estado === 'activo' ? { revisionSolicitadaEn: null, comentarioRevision: null } : {}),
      },
    });

    // Al publicarse, los pedidos de cambios del admin quedan como realizados
    if (estado === 'activo') {
      await prisma.mensajeRevision.updateMany({ where: { idCurso: cursoActualizado.id, resueltoEn: null }, data: { resueltoEn: new Date() } });
    }

    if (publicandoRevision) {
      await avisarInstructores(cursoActualizado.id, {
        tipo: 'curso_publicado',
        titulo: 'Tu curso fue publicado',
        mensaje: cursoActualizado.titulo,
        enlace: `/panel-instructor/cursos/${cursoActualizado.id}/editar`,
        asunto: `Tu curso "${cursoActualizado.titulo}" ya está publicado`,
        parrafos: [
          `El administrador publicó <strong style="color:#ffffff;">${escapar(cursoActualizado.titulo)}</strong>.`,
          'Ya aparece en el catálogo y se puede comprar.',
        ],
      });
    }

    res.json(cursoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado del curso' });
  }
}

// "Eliminar" un curso (solo admin): ya no se borra de la base, se archiva
// (borrado lógico). Se mantiene esta ruta por compatibilidad.
async function eliminarCurso(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del curso no es válido' });
    }

    const cursoExistente = await prisma.curso.findUnique({ where: { id: parseInt(id) } });
    if (!cursoExistente) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const curso = await prisma.curso.update({
      where: { id: parseInt(id) },
      data: { estado: 'archivado', archivadoEn: cursoExistente.archivadoEn || new Date() },
    });

    res.json({ mensaje: 'Curso archivado correctamente', curso });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el curso' });
  }
}

// Solo admin: sube la imagen de portada de un curso y devuelve su URL pública
async function subirFotoCurso(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const extension = req.file.originalname.split('.').pop();
    const nombreArchivo = `curso-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from('perfiles')
      .upload(nombreArchivo, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (errorSubida) {
      console.error(errorSubida);
      return res.status(500).json({ error: 'Error al subir la imagen' });
    }

    const { data: dataPublica } = supabase.storage
      .from('perfiles')
      .getPublicUrl(nombreArchivo);

    res.json({ url: dataPublica.publicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
}

// Un curso recién actualizado, con la lista de colaboradores lista para
// devolver al frontend (se repite igual en los tres métodos de abajo).
function incluirColaboradores(idCurso) {
  return prisma.curso.findUnique({
    where: { id: idCurso },
    include: {
      colaboradores: {
        orderBy: { orden: 'asc' },
        include: { usuario: { select: { id: true, nombre: true, apellido: true, rol: true } } },
      },
    },
  });
}

// Agrega a alguien como instructor/colaborador de un curso. Solo el admin
// puede dar de alta a una persona nueva en la lista (le da acceso de edición
// al curso): un instructor no puede traer a cualquiera por su cuenta, solo
// puede elegir, entre quienes el admin ya puso en la lista, a quién mostrar
// o no en la página pública (ver actualizarColaborador). Por defecto queda
// visible; no cambia el estado de publicación.
async function agregarColaborador(req, res) {
  try {
    const { id } = req.params;
    const { idUsuario } = req.body;
    if (!id || isNaN(parseInt(id)) || !idUsuario || isNaN(parseInt(idUsuario))) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo el administrador puede agregar nuevos colaboradores a un curso' });
    }

    const usuarioAAgregar = await prisma.usuario.findUnique({ where: { id: parseInt(idUsuario) } });
    if (!usuarioAAgregar || !['admin', 'profesor'].includes(usuarioAAgregar.rol)) {
      return res.status(400).json({ error: 'Solo se puede agregar como colaborador a un administrador o instructor' });
    }

    const yaEsColaborador = await prisma.cursoColaborador.findUnique({
      where: { idCurso_idUsuario: { idCurso: parseInt(id), idUsuario: parseInt(idUsuario) } },
    });
    if (yaEsColaborador) {
      return res.status(400).json({ error: 'Esa persona ya es colaboradora de este curso' });
    }

    const { _max } = await prisma.cursoColaborador.aggregate({
      where: { idCurso: parseInt(id) },
      _max: { orden: true },
    });

    await prisma.cursoColaborador.create({
      data: { idCurso: parseInt(id), idUsuario: parseInt(idUsuario), visible: true, orden: (_max.orden ?? -1) + 1 },
    });

    res.json(await incluirColaboradores(parseInt(id)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar el colaborador' });
  }
}

// Cambia si un colaborador se muestra como instructor en la página pública
// (visible), su etiqueta y/o su orden. No afecta su acceso de edición: eso lo
// da estar en la lista de colaboradores, no este flag.
async function actualizarColaborador(req, res) {
  try {
    const { id, idUsuario } = req.params;
    if (!id || isNaN(parseInt(id)) || !idUsuario || isNaN(parseInt(idUsuario))) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    if (!(await puedeOperarSobreCurso(req.usuario, parseInt(id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }

    const { visible, etiqueta, orden } = req.body;
    const data = {};
    if (visible !== undefined) data.visible = Boolean(visible);
    if (etiqueta !== undefined) data.etiqueta = (etiqueta || '').trim() || null;
    if (orden !== undefined) data.orden = parseInt(orden);

    await prisma.cursoColaborador.update({
      where: { idCurso_idUsuario: { idCurso: parseInt(id), idUsuario: parseInt(idUsuario) } },
      data,
    });

    res.json(await incluirColaboradores(parseInt(id)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el colaborador' });
  }
}

// Sacar a alguien de la lista de colaboradores: pierde el acceso de edición y
// deja de poder aparecer como instructor. El admin puede sacar a cualquiera;
// un instructor solo puede sacarse a sí mismo (no puede decidir por otro).
async function quitarColaborador(req, res) {
  try {
    const { id, idUsuario } = req.params;
    if (!id || isNaN(parseInt(id)) || !idUsuario || isNaN(parseInt(idUsuario))) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    if (!(await puedeOperarSobreCurso(req.usuario, parseInt(id)))) {
      return res.status(403).json({ error: 'No podés editar un curso que no es tuyo' });
    }
    if (req.usuario.rol !== 'admin' && req.usuario.id !== parseInt(idUsuario)) {
      return res.status(403).json({ error: 'Solo podés sacarte a vos mismo de la lista' });
    }

    await prisma.cursoColaborador.deleteMany({
      where: { idCurso: parseInt(id), idUsuario: parseInt(idUsuario) },
    });

    res.json(await incluirColaboradores(parseInt(id)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al quitar el colaborador' });
  }
}

// Campana para todos los instructores del curso y un mail a cada uno
async function avisarInstructores(idCurso, { tipo, titulo, mensaje, enlace, asunto, parrafos }) {
  const instructores = await instructoresDelCurso(idCurso);
  if (instructores.length === 0) return;
  await notificar({ para: instructores.map((i) => i.id), tipo, titulo, mensaje, enlace });
  await Promise.all(instructores.map((i) => notificar({
    para: [], tipo, titulo, enlace,
    email: { a: i.email, asunto, parrafos, textoBoton: 'Abrir el curso' },
  })));
}

// POST /cursos/:id/solicitar-publicacion (instructor del curso)
// El curso tiene que cumplir lo mínimo para publicarse; el admin recibe el aviso.
async function solicitarPublicacion(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!(await puedeOperarSobreCurso(req.usuario, id))) {
      return res.status(403).json({ error: 'No tenés permiso sobre este curso' });
    }
    const curso = await prisma.curso.findUnique({ where: { id } });
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    if (curso.estado === 'activo') return res.status(400).json({ error: 'El curso ya está publicado' });
    if (curso.estado === 'archivado') return res.status(400).json({ error: 'El curso está archivado' });

    const faltantes = await faltantesParaPublicar(id);
    if (faltantes.length > 0) {
      return res.status(400).json({ error: `Antes de pedir la publicación: ${faltantes.join(' ')}`, faltantes });
    }

    const actualizado = await prisma.curso.update({
      where: { id },
      data: { revisionSolicitadaEn: new Date(), comentarioRevision: null },
    });

    const nombre = `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim()
      || (await prisma.usuario.findUnique({ where: { id: req.usuario.id }, select: { nombre: true, apellido: true } })
        .then((u) => `${u.nombre} ${u.apellido}`));
    await notificar({
      para: 'admins',
      tipo: 'revision_curso',
      titulo: 'Pedido de publicación',
      mensaje: `${nombre} · ${curso.titulo}`,
      enlace: `/admin/cursos/${id}/editar`,
      email: {
        a: 'avisos',
        asunto: `${nombre} pidió publicar "${curso.titulo}"`,
        titulo: 'Pedido de publicación',
        parrafos: [
          `<strong style="color:#ffffff;">${escapar(nombre)}</strong> terminó el curso <strong style="color:#ffffff;">${escapar(curso.titulo)}</strong> y pidió que lo publiques.`,
          'Revisalo y publicalo, o devolvéselo con un comentario de lo que falta.',
        ],
        textoBoton: 'Revisar el curso',
      },
    });

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo enviar la solicitud' });
  }
}

// POST /cursos/:id/devolver { comentario } (admin): no se publica todavía
async function devolverCurso(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const comentario = String(req.body.comentario || '').trim().slice(0, 1000);
    if (!comentario) return res.status(400).json({ error: 'Escribí qué le falta al curso' });

    const curso = await prisma.curso.findUnique({ where: { id } });
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const [actualizado] = await prisma.$transaction([
      prisma.curso.update({
        where: { id },
        data: { revisionSolicitadaEn: null, comentarioRevision: comentario },
      }),
      prisma.mensajeRevision.create({ data: { idCurso: id, idAutor: req.usuario.id, texto: comentario } }),
    ]);

    await avisarInstructores(id, {
      tipo: 'curso_devuelto',
      titulo: 'Tu curso necesita cambios',
      mensaje: `${curso.titulo}: ${comentario}`,
      enlace: `/panel-instructor/cursos/${id}/editar`,
      asunto: `Tu curso "${curso.titulo}" necesita cambios antes de publicarse`,
      parrafos: [
        `El administrador revisó <strong style="color:#ffffff;">${escapar(curso.titulo)}</strong> y te dejó este comentario:`,
        `<em style="color:#ffffff;">"${escapar(comentario)}"</em>`,
        'Cuando lo tengas, volvé a pedir la publicación desde el editor.',
      ],
    });

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo devolver el curso' });
  }
}

// GET /api/cursos/:id/mensajes-revision — historial de comentarios del admin
// (lo ven el admin y los instructores del curso)
async function listarMensajesRevision(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!(await puedeOperarSobreCurso(req.usuario, id))) {
      return res.status(403).json({ error: 'No tenés permiso sobre este curso' });
    }
    const mensajes = await prisma.mensajeRevision.findMany({
      where: { idCurso: id },
      orderBy: { creadoEn: 'desc' },
      take: 50,
      select: {
        id: true, texto: true, creadoEn: true, leidoEn: true, resueltoEn: true,
        autor: { select: { nombre: true, apellido: true } },
      },
    });
    res.json(mensajes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron cargar los mensajes' });
  }
}

// PATCH /api/cursos/:id/mensajes-revision/:idMensaje { leido?: bool, resuelto?: bool }
//  - leido: lo marca el instructor (o el admin) cuando ya lo vio
//  - resuelto: admin o instructor; deja de figurar como "Pendiente"
async function actualizarMensajeRevision(req, res) {
  try {
    const idCurso = parseInt(req.params.id, 10);
    const idMensaje = parseInt(req.params.idMensaje, 10);
    if (!(await puedeOperarSobreCurso(req.usuario, idCurso))) {
      return res.status(403).json({ error: 'No tenés permiso sobre este curso' });
    }
    const mensaje = await prisma.mensajeRevision.findFirst({ where: { id: idMensaje, idCurso } });
    if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const data = {};
    if (typeof req.body.leido === 'boolean') data.leidoEn = req.body.leido ? (mensaje.leidoEn || new Date()) : null;
    // Realizado: lo pueden marcar el admin y los instructores del curso (es una
    // ayuda para organizarse, no un permiso)
    if (typeof req.body.resuelto === 'boolean') {
      data.resueltoEn = req.body.resuelto ? (mensaje.resueltoEn || new Date()) : null;
    }
    const actualizado = await prisma.mensajeRevision.update({
      where: { id: idMensaje },
      data,
      select: {
        id: true, texto: true, creadoEn: true, leidoEn: true, resueltoEn: true,
        autor: { select: { nombre: true, apellido: true } },
      },
    });

    // Si ya no queda ningún pedido pendiente, el aviso del curso se limpia
    const pendientes = await prisma.mensajeRevision.count({ where: { idCurso, resueltoEn: null } });
    if (pendientes === 0) await prisma.curso.update({ where: { id: idCurso }, data: { comentarioRevision: null } });
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo actualizar el mensaje' });
  }
}

module.exports = {
  listarMensajesRevision,
  actualizarMensajeRevision,
  solicitarPublicacion,
  devolverCurso,
  listarCategorias,
  crearCurso,
  listarCursos,
  listarCursosAdmin,
  obtenerCurso,
  editarCurso,
  cambiarEstadoCurso,
  eliminarCurso,
  subirFotoCurso,
  agregarColaborador,
  actualizarColaborador,
  quitarColaborador,
};
const prisma = require('../config/prisma');
const { notificar, escapar } = require('../utils/notificar');
const { instructoresDelCurso } = require('../utils/instructoresCurso');
const { puedeOperarSobreCurso } = require('../utils/permisosCurso');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');

const LARGO_MAXIMO = 2000;

// La clase existe y a qué curso pertenece
async function claseConCurso(idContenido) {
  return prisma.contenido.findUnique({
    where: { id: idContenido },
    select: { id: true, titulo: true, modulo: { select: { idCurso: true, curso: { select: { id: true, titulo: true } } } } },
  });
}

async function estaInscripto(idUsuario, idCurso) {
  const inscripcion = await prisma.inscripcion.findFirst({
    where: { idUsuario, idCurso, ...INSCRIPCION_VIGENTE },
    select: { id: true },
  });
  return Boolean(inscripcion);
}

const SELECT_CONSULTA = {
  id: true,
  texto: true,
  creadaEn: true,
  respuesta: true,
  respondidaEn: true,
  respondedor: { select: { id: true, nombre: true, apellido: true, rol: true } },
};

// ---------- Alumno ----------

// GET /api/consultas/clase/:idContenido — las preguntas propias en esa clase
async function misConsultasDeClase(req, res) {
  try {
    const idContenido = parseInt(req.params.idContenido, 10);
    const consultas = await prisma.consultaClase.findMany({
      where: { idContenido, idAlumno: req.usuario.id },
      orderBy: { creadaEn: 'asc' },
      select: { ...SELECT_CONSULTA, respuestaVista: true },
    });
    // Al verlas acá, las respuestas nuevas pasan a vistas (se devuelven marcadas como "nueva" esta vez)
    const nuevas = consultas.filter((c) => c.respondidaEn && !c.respuestaVista).map((c) => c.id);
    if (nuevas.length > 0) {
      await prisma.consultaClase.updateMany({ where: { id: { in: nuevas } }, data: { respuestaVista: true } });
    }
    res.json(consultas.map(({ respuestaVista, ...c }) => ({ ...c, nueva: nuevas.includes(c.id) })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron cargar tus preguntas' });
  }
}

// POST /api/consultas/clase/:idContenido { texto }
async function crearConsulta(req, res) {
  try {
    const idContenido = parseInt(req.params.idContenido, 10);
    const texto = String(req.body.texto || '').trim().slice(0, LARGO_MAXIMO);
    if (!texto) return res.status(400).json({ error: 'Escribí tu pregunta' });

    const clase = await claseConCurso(idContenido);
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
    const { curso } = clase.modulo;

    if (!(await estaInscripto(req.usuario.id, curso.id)) && !(await puedeOperarSobreCurso(req.usuario, curso.id))) {
      return res.status(403).json({ error: 'Necesitás estar inscripto en el curso para preguntar' });
    }

    // Freno simple: hasta 10 preguntas por hora por persona
    const recientes = await prisma.consultaClase.count({
      where: { idAlumno: req.usuario.id, creadaEn: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recientes >= 10) {
      return res.status(429).json({ error: 'Hiciste muchas preguntas seguidas. Probá de nuevo en un rato.' });
    }

    const consulta = await prisma.consultaClase.create({
      data: { idContenido, idCurso: curso.id, idAlumno: req.usuario.id, texto },
      select: SELECT_CONSULTA,
    });

    // Avisos: campana para los instructores del curso y el admin; mail al
    // instructor del curso (si el curso no tiene instructor, al mail del estudio)
    const alumno = await prisma.usuario.findUnique({ where: { id: req.usuario.id }, select: { nombre: true, apellido: true } });
    const nombre = `${alumno.nombre} ${alumno.apellido}`;
    const instructores = await instructoresDelCurso(curso.id);
    const aviso = {
      tipo: 'consulta',
      titulo: 'Pregunta nueva',
      mensaje: `${nombre} · ${curso.titulo} · ${clase.titulo}`,
    };
    await notificar({ ...aviso, para: 'admins', enlace: '/admin/preguntas' });
    if (instructores.length > 0) {
      await notificar({ ...aviso, para: instructores.map((i) => i.id), enlace: '/panel-instructor/preguntas' });
    }
    const correo = {
      asunto: `Pregunta nueva en "${curso.titulo}"`,
      titulo: 'Tenés una pregunta nueva',
      parrafos: [
        `<strong style="color:#ffffff;">${escapar(nombre)}</strong> preguntó en la clase <strong style="color:#ffffff;">${escapar(clase.titulo)}</strong> de ${escapar(curso.titulo)}:`,
        `<em style="color:#ffffff;">"${escapar(texto)}"</em>`,
      ],
      textoBoton: 'Responder',
    };
    if (instructores.length > 0) {
      await Promise.all(instructores.map((i) => notificar({
        para: [], ...aviso, enlace: '/panel-instructor/preguntas', email: { a: i.email, ...correo },
      })));
    } else {
      await notificar({ para: [], ...aviso, enlace: '/admin/preguntas', email: { a: 'avisos', ...correo } });
    }

    res.status(201).json(consulta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo enviar tu pregunta' });
  }
}

// ---------- Panel (admin e instructores) ----------

// Cursos sobre los que puede responder: el admin, todos; el instructor, los suyos
async function filtroCursos(usuario) {
  if (usuario.rol === 'admin') return {};
  return {
    curso: {
      OR: [
        { idAdminCreador: usuario.id },
        { colaboradores: { some: { idUsuario: usuario.id } } },
      ],
    },
  };
}

// GET /api/consultas/mias — las últimas preguntas del alumno y cuántas respuestas no vio
async function misConsultasRecientes(req, res) {
  try {
    const idAlumno = req.usuario.id;
    const [items, sinVer] = await Promise.all([
      prisma.consultaClase.findMany({
        where: { idAlumno },
        orderBy: [{ respuestaVista: 'asc' }, { respondidaEn: { sort: 'desc', nulls: 'last' } }, { creadaEn: 'desc' }],
        take: 4,
        select: {
          id: true, texto: true, creadaEn: true, respondidaEn: true, respuestaVista: true, idCurso: true, idContenido: true,
          curso: { select: { titulo: true } },
          contenido: { select: { titulo: true } },
        },
      }),
      prisma.consultaClase.count({ where: { idAlumno, respondidaEn: { not: null }, respuestaVista: false } }),
    ]);
    res.json({
      sinVer,
      items: items.map(({ respuestaVista, ...c }) => ({ ...c, nueva: Boolean(c.respondidaEn) && !respuestaVista })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron cargar tus preguntas' });
  }
}

// GET /api/consultas?vista=pendientes|respondidas&pagina=
async function listarConsultas(req, res) {
  try {
    const respondidas = req.query.vista === 'respondidas';
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const porPagina = 10;
    const base = await filtroCursos(req.usuario);
    const where = { ...base, respondidaEn: respondidas ? { not: null } : null };

    const [items, total, pendientes] = await Promise.all([
      prisma.consultaClase.findMany({
        where,
        orderBy: respondidas ? { respondidaEn: 'desc' } : { creadaEn: 'asc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        select: {
          ...SELECT_CONSULTA,
          alumno: { select: { nombre: true, apellido: true, email: true, fotoPerfil: true } },
          curso: { select: { id: true, titulo: true } },
          contenido: { select: { id: true, titulo: true } },
        },
      }),
      prisma.consultaClase.count({ where }),
      prisma.consultaClase.count({ where: { ...base, respondidaEn: null } }),
    ]);
    res.json({ items, total, pagina, porPagina, pendientes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron cargar las preguntas' });
  }
}

// GET /api/consultas/pendientes — solo el número (para el menú)
async function contarPendientes(req, res) {
  try {
    const base = await filtroCursos(req.usuario);
    const pendientes = await prisma.consultaClase.count({ where: { ...base, respondidaEn: null } });
    res.json({ pendientes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo contar las preguntas' });
  }
}

// POST /api/consultas/:id/responder { respuesta } — también sirve para editarla
async function responderConsulta(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const respuesta = String(req.body.respuesta || '').trim().slice(0, LARGO_MAXIMO);
    if (!respuesta) return res.status(400).json({ error: 'Escribí la respuesta' });

    const consulta = await prisma.consultaClase.findUnique({
      where: { id },
      select: {
        id: true, idCurso: true, idContenido: true, texto: true, respondidaEn: true, idRespondedor: true,
        respondedor: { select: { nombre: true, apellido: true } },
        alumno: { select: { nombre: true, email: true } },
        curso: { select: { titulo: true } },
        contenido: { select: { titulo: true } },
      },
    });
    if (!consulta) return res.status(404).json({ error: 'Pregunta no encontrada' });
    if (!(await puedeOperarSobreCurso(req.usuario, consulta.idCurso))) {
      return res.status(403).json({ error: 'No podés responder preguntas de este curso' });
    }

    // Una respuesta la edita solo quien la escribió (el admin no pisa la del
    // instructor ni al revés)
    const primeraVez = !consulta.respondidaEn;
    if (!primeraVez && consulta.idRespondedor && consulta.idRespondedor !== req.usuario.id) {
      const autor = consulta.respondedor ? `${consulta.respondedor.nombre} ${consulta.respondedor.apellido}`.trim() : 'otra persona';
      return res.status(403).json({ error: `Esta pregunta ya la respondió ${autor}. Solo esa persona puede editar la respuesta.` });
    }

    let actualizada;
    if (primeraVez) {
      // Si dos la responden a la vez, gana el primero
      const { count } = await prisma.consultaClase.updateMany({
        where: { id, respondidaEn: null },
        data: { respuesta, respondidaEn: new Date(), idRespondedor: req.usuario.id, respuestaVista: false },
      });
      if (count === 0) return res.status(409).json({ error: 'Alguien respondió esta pregunta recién. Actualizá la lista.' });
      actualizada = await prisma.consultaClase.findUnique({ where: { id }, select: SELECT_CONSULTA });
    } else {
      actualizada = await prisma.consultaClase.update({ where: { id }, data: { respuesta }, select: SELECT_CONSULTA });
    }

    // Mail al alumno con la respuesta (solo la primera vez, no en cada edición)
    if (primeraVez) {
      await notificar({
        para: [],
        tipo: 'consulta_respondida',
        titulo: 'Respondieron tu pregunta',
        enlace: `/cursos/${consulta.idCurso}/aprender?clase=${consulta.idContenido}`,
        email: {
          a: consulta.alumno.email,
          asunto: `Respondieron tu pregunta en "${consulta.curso.titulo}"`,
          titulo: 'Respondieron tu pregunta',
          parrafos: [
            `Hola ${escapar(consulta.alumno.nombre)}, sobre la clase <strong style="color:#ffffff;">${escapar(consulta.contenido.titulo)}</strong> preguntaste:`,
            `<em>"${escapar(consulta.texto)}"</em>`,
            `Respuesta: <span style="color:#ffffff;">${escapar(respuesta)}</span>`,
          ],
          textoBoton: 'Ir a la clase',
        },
      });
    }

    res.json(actualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar la respuesta' });
  }
}

module.exports = { misConsultasRecientes, misConsultasDeClase, crearConsulta, listarConsultas, contarPendientes, responderConsulta };

const prisma = require('../config/prisma');
const { INSCRIPCION_VIGENTE } = require('./inscripcionVigente');

// Helpers para recorrer la cadena de relaciones (módulo -> contenido -> bloque
// -> pregunta) hasta llegar al id del curso al que pertenece cada recurso.

async function idCursoDeModulo(idModulo) {
  const modulo = await prisma.modulo.findUnique({
    where: { id: idModulo },
    select: { idCurso: true },
  });
  return modulo?.idCurso ?? null;
}

async function idCursoDeContenido(idContenido) {
  const contenido = await prisma.contenido.findUnique({
    where: { id: idContenido },
    select: { modulo: { select: { idCurso: true } } },
  });
  return contenido?.modulo?.idCurso ?? null;
}

async function idCursoDeBloque(idBloque) {
  const bloque = await prisma.bloque.findUnique({
    where: { id: idBloque },
    select: { contenido: { select: { modulo: { select: { idCurso: true } } } } },
  });
  return bloque?.contenido?.modulo?.idCurso ?? null;
}

async function idCursoDePregunta(idPregunta) {
  const pregunta = await prisma.pregunta.findUnique({
    where: { id: idPregunta },
    select: { bloque: { select: { contenido: { select: { modulo: { select: { idCurso: true } } } } } } },
  });
  return pregunta?.bloque?.contenido?.modulo?.idCurso ?? null;
}

// Un admin puede operar sobre cualquier curso. Un profesor (instructor) solo
// puede operar sobre un curso si es quien lo creó o si está en la lista de
// colaboradores de ese curso puntual (alguien se lo asignó para que lo
// revise, lo ayude, o simplemente para que figure como instructor). Estar
// visible o no en la página pública no cambia este permiso.
async function puedeOperarSobreCurso(usuario, idCurso) {
  if (!idCurso) return false;
  if (usuario.rol === 'admin') return true;
  if (usuario.rol !== 'profesor') return false;

  const curso = await prisma.curso.findUnique({
    where: { id: idCurso },
    select: { idAdminCreador: true, colaboradores: { select: { idUsuario: true } } },
  });
  if (!curso) return false;
  return curso.idAdminCreador === usuario.id
    || curso.colaboradores.some((c) => c.idUsuario === usuario.id);
}

// Puede VER el contenido completo de un curso: quien puede operarlo (admin o
// instructor del curso) o un alumno inscripto.
async function puedeVerContenidoCurso(usuario, idCurso) {
  if (!usuario || !idCurso) return false;
  if (await puedeOperarSobreCurso(usuario, idCurso)) return true;
  const inscripcion = await prisma.inscripcion.findFirst({
    where: { idUsuario: usuario.id, idCurso, ...INSCRIPCION_VIGENTE },
    select: { id: true },
  });
  return Boolean(inscripcion);
}

module.exports = {
  puedeVerContenidoCurso,
  idCursoDeModulo,
  idCursoDeContenido,
  idCursoDeBloque,
  idCursoDePregunta,
  puedeOperarSobreCurso,
};

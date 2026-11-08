const prisma = require('../config/prisma');
const { borrarCursoDefinitivo } = require('../utils/borrarCurso');
const { borrarSesionesViejas } = require('../utils/sesion');

// Tareas automáticas que corren al iniciar el servidor y después una vez por día.
// Los plazos se pueden cambiar desde el .env sin tocar el código.
const DIAS_INACTIVIDAD_ALUMNO = Number(process.env.DIAS_INACTIVIDAD_ALUMNO) || 90;
const DIAS_BORRADO_ARCHIVADOS = Number(process.env.DIAS_BORRADO_ARCHIVADOS) || 60;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

function haceDias(dias) {
  return new Date(Date.now() - dias * UN_DIA_MS);
}

// 1) Alumnos sin actividad en los últimos N días pasan a inactivos. La cuenta
//    no se bloquea: solo salen de la lista principal del panel.
async function marcarAlumnosInactivos() {
  const { count } = await prisma.usuario.updateMany({
    where: { rol: 'alumno', activo: true, ultimaActividad: { lt: haceDias(DIAS_INACTIVIDAD_ALUMNO) } },
    data: { activo: false },
  });
  return count;
}

// 2) Cursos archivados hace más de N días y SIN ventas se borran definitivamente.
//    Los que tienen al menos una compra real nunca se borran (se perdería el
//    historial de ventas, el progreso y los certificados de esos alumnos).
async function borrarArchivadosVencidos() {
  const vencidos = await prisma.curso.findMany({
    where: {
      estado: 'archivado',
      archivadoEn: { lt: haceDias(DIAS_BORRADO_ARCHIVADOS) },
      inscripciones: { none: { esVistaPrevia: false } },
    },
    select: { id: true, titulo: true },
  });
  for (const curso of vencidos) {
    await borrarCursoDefinitivo(curso.id);
    console.log(`[mantenimiento] Curso archivado borrado definitivamente: #${curso.id} "${curso.titulo}"`);
  }
  return vencidos.length;
}

// Los avisos ya leídos de hace más de 90 días no sirven más: se borran
async function borrarNotificacionesViejas() {
  const limite = new Date(Date.now() - 90 * UN_DIA_MS);
  const { count } = await prisma.notificacion.deleteMany({ where: { leida: true, creadaEn: { lt: limite } } });
  return count;
}

async function correrMantenimiento() {
  try {
    const inactivos = await marcarAlumnosInactivos();
    const borrados = await borrarArchivadosVencidos();
    await borrarNotificacionesViejas();
    await borrarSesionesViejas();
    if (inactivos || borrados) {
      console.log(`[mantenimiento] ${inactivos} alumno(s) pasaron a inactivos, ${borrados} curso(s) archivado(s) borrados`);
    }
  } catch (error) {
    console.error('[mantenimiento] Error en la tarea diaria:', error);
  }
}

function iniciarMantenimiento() {
  // Un rato después de arrancar (para no competir con el inicio) y luego cada 24 h
  setTimeout(correrMantenimiento, 10 * 1000);
  setInterval(correrMantenimiento, UN_DIA_MS);
}

module.exports = {
  iniciarMantenimiento,
  correrMantenimiento,
  marcarAlumnosInactivos,
  borrarArchivadosVencidos,
  DIAS_INACTIVIDAD_ALUMNO,
  DIAS_BORRADO_ARCHIVADOS,
};

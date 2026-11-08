const prisma = require('../config/prisma');

// Instructores de un curso: el creador y los colaboradores con rol de instructor
async function instructoresDelCurso(idCurso) {
  const curso = await prisma.curso.findUnique({
    where: { id: idCurso },
    select: {
      adminCreador: { select: { id: true, rol: true, email: true } },
      colaboradores: { select: { usuario: { select: { id: true, rol: true, email: true } } } },
    },
  });
  if (!curso) return [];
  const todos = [curso.adminCreador, ...curso.colaboradores.map((c) => c.usuario)];
  const vistos = new Set();
  return todos.filter((u) => u.rol === 'profesor' && !vistos.has(u.id) && vistos.add(u.id));
}

module.exports = { instructoresDelCurso };

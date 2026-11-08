const prisma = require('../config/prisma');

// Filtros de la campana: qué tipos de aviso entran en cada grupo
const GRUPOS = {
  ventas: ['venta', 'arrepentimiento'],
  gestion: ['revision_curso', 'curso_devuelto', 'curso_publicado'],
  preguntas: ['consulta'],
};

function whereGrupo(idUsuario, grupo) {
  const where = { idUsuario };
  if (GRUPOS[grupo]) where.tipo = { in: GRUPOS[grupo] };
  return where;
}

// GET /api/notificaciones?grupo=ventas|gestion|preguntas — las últimas 20 (del
// grupo, si se pide uno), cuántas no leyó en total y cuántas por grupo
async function listarNotificaciones(req, res) {
  try {
    const idUsuario = req.usuario.id;
    const grupo = GRUPOS[req.query.grupo] ? req.query.grupo : null;
    const [items, noLeidas, porTipo] = await Promise.all([
      prisma.notificacion.findMany({ where: whereGrupo(idUsuario, grupo), orderBy: { creadaEn: 'desc' }, take: 20 }),
      prisma.notificacion.count({ where: { idUsuario, leida: false } }),
      prisma.notificacion.groupBy({ by: ['tipo'], where: { idUsuario, leida: false }, _count: { _all: true } }),
    ]);
    const noLeidasPorGrupo = Object.fromEntries(Object.entries(GRUPOS).map(([nombre, tipos]) => [
      nombre,
      porTipo.filter((t) => tipos.includes(t.tipo)).reduce((n, t) => n + t._count._all, 0),
    ]));
    res.json({ items, noLeidas, noLeidasPorGrupo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
}

// PATCH /api/notificaciones/:id/leida
async function marcarLeida(req, res) {
  try {
    await prisma.notificacion.updateMany({
      where: { id: parseInt(req.params.id, 10), idUsuario: req.usuario.id },
      data: { leida: true },
    });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo marcar la notificación' });
  }
}

// PATCH /api/notificaciones/leidas?grupo= : todas las del usuario (o las del grupo)
async function marcarTodasLeidas(req, res) {
  try {
    await prisma.notificacion.updateMany({ where: { ...whereGrupo(req.usuario.id, req.query.grupo), leida: false }, data: { leida: true } });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudieron marcar las notificaciones' });
  }
}

module.exports = { listarNotificaciones, marcarLeida, marcarTodasLeidas };

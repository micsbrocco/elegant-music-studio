const prisma = require('../config/prisma');
const { INSCRIPCION_VIGENTE } = require('./inscripcionVigente');

// Interruptor "Próximamente": cuando está activo, la parte de cursos queda
// cerrada al público (catálogo, detalle, carrito, compras y registro).
// El admin y los instructores siguen viendo y editando todo, y los alumnos
// que ya compraron un curso pueden seguir cursándolo.

// Se guarda unos segundos en memoria para no consultar la base en cada pedido
let cache = { valor: false, hasta: 0 };

async function modoProximamente() {
  if (Date.now() < cache.hasta) return cache.valor;
  const fila = await prisma.configuracionSitio.findUnique({ where: { id: 1 } });
  cache = { valor: Boolean(fila?.modoProximamente), hasta: Date.now() + 15000 };
  return cache.valor;
}

async function cambiarModoProximamente(valor) {
  await prisma.configuracionSitio.upsert({
    where: { id: 1 },
    update: { modoProximamente: valor },
    create: { id: 1, modoProximamente: valor },
  });
  cache = { valor, hasta: Date.now() + 15000 };
}

const esEquipo = (usuario) => usuario?.rol === 'admin' || usuario?.rol === 'profesor';

function responderCerrado(res) {
  return res.status(403).json({ error: 'Los cursos estarán disponibles próximamente.', codigo: 'PROXIMAMENTE' });
}

// Middleware: corta el pedido si el sitio está en "Próximamente" (salvo admin/instructores)
async function soloSiCursosAbiertos(req, res, next) {
  try {
    if (!esEquipo(req.usuario) && (await modoProximamente())) return responderCerrado(res);
    next();
  } catch (error) {
    next(error);
  }
}

// Detalle de un curso: además del equipo, lo puede ver quien ya está inscripto
async function soloSiCursoVisible(req, res, next) {
  try {
    if (esEquipo(req.usuario) || !(await modoProximamente())) return next();
    if (req.usuario) {
      const inscripcion = await prisma.inscripcion.findFirst({
        where: { idUsuario: req.usuario.id, idCurso: parseInt(req.params.id), ...INSCRIPCION_VIGENTE },
        select: { id: true },
      });
      if (inscripcion) return next();
    }
    return responderCerrado(res);
  } catch (error) {
    next(error);
  }
}

module.exports = { modoProximamente, cambiarModoProximamente, soloSiCursosAbiertos, soloSiCursoVisible, responderCerrado };

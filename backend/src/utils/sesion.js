const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Cómo funciona la sesión:
// - Token de acceso (JWT): dura pocos minutos y el frontend lo tiene solo en
//   memoria (no en localStorage). Va en cada pedido como "Authorization: Bearer".
// - Token de renovación: un valor al azar en una cookie httpOnly (JavaScript no
//   la puede leer). Sirve solo para pedir un token de acceso nuevo. En la base
//   se guarda su hash, nunca el valor.
// - Cada renovación cambia el token de renovación (rotación). Si alguien usa uno
//   viejo, es una copia robada y la sesión se corta.
const MINUTOS_ACCESO = Number(process.env.SESION_MINUTOS_ACCESO) || 15;
const DIAS_INACTIVIDAD = Number(process.env.SESION_DIAS_INACTIVIDAD) || 3;
const DIAS_MAXIMO = Number(process.env.SESION_DIAS_MAXIMO) || 14;
// Dos pestañas pueden renovar a la vez con la misma cookie: unos segundos de
// tolerancia para que eso no se tome como robo.
const SEGUNDOS_TOLERANCIA = 30;

const NOMBRE_COOKIE = 'ems_sesion';
const DIA = 24 * 60 * 60 * 1000;

const hashear = (valor) => crypto.createHash('sha256').update(valor).digest('hex');
const tokenNuevo = () => crypto.randomBytes(32).toString('base64url');

function opcionesCookie(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge,
  };
}

function leerCookie(req) {
  const cookies = req.headers.cookie || '';
  const par = cookies.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${NOMBRE_COOKIE}=`));
  return par ? decodeURIComponent(par.slice(NOMBRE_COOKIE.length + 1)) : null;
}

function firmarAcceso(usuario, idSesion) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, sid: idSesion },
    process.env.JWT_SECRET,
    { expiresIn: `${MINUTOS_ACCESO}m` },
  );
}

// Vence por inactividad, pero nunca después del máximo desde que se inició
function proximoVencimiento(creadaEn) {
  const porInactividad = Date.now() + DIAS_INACTIVIDAD * DIA;
  const maximo = new Date(creadaEn).getTime() + DIAS_MAXIMO * DIA;
  return new Date(Math.min(porInactividad, maximo));
}

function guardarCookie(res, token, expiraEn) {
  res.cookie(NOMBRE_COOKIE, token, opcionesCookie(expiraEn.getTime() - Date.now()));
}

// Al iniciar sesión (email o Google): crea la sesión y devuelve el token de acceso
async function iniciarSesion(req, res, usuario) {
  const token = tokenNuevo();
  const ahora = new Date();
  const sesion = await prisma.sesionUsuario.create({
    data: {
      idUsuario: usuario.id,
      tokenHash: hashear(token),
      expiraEn: proximoVencimiento(ahora),
      agente: String(req.headers['user-agent'] || '').slice(0, 200) || null,
    },
  });
  guardarCookie(res, token, sesion.expiraEn);
  return firmarAcceso(usuario, sesion.id);
}

// Devuelve { token, usuario } o null si no hay una sesión válida
async function renovarSesion(req, res) {
  const token = leerCookie(req);
  if (!token) return null;
  const hash = hashear(token);
  const ahora = new Date();

  let sesion = await prisma.sesionUsuario.findUnique({ where: { tokenHash: hash } });
  let rotar = true;

  if (!sesion) {
    // ¿Es el token anterior de alguna sesión?
    const anterior = await prisma.sesionUsuario.findFirst({ where: { tokenAnteriorHash: hash } });
    if (!anterior) return null;
    const segundos = (ahora - new Date(anterior.rotadaEn)) / 1000;
    if (segundos > SEGUNDOS_TOLERANCIA) {
      // Reutilizaron un token viejo: se corta esa sesión por seguridad
      await prisma.sesionUsuario.update({ where: { id: anterior.id }, data: { revocadaEn: ahora } });
      return null;
    }
    // Otra pestaña acaba de renovar: se da acceso sin volver a rotar
    sesion = anterior;
    rotar = false;
  }

  if (sesion.revocadaEn || sesion.expiraEn <= ahora) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.idUsuario },
    // Los mismos datos que devuelve el login, sin nada secreto
    omit: {
      password: true, resetPasswordToken: true, resetPasswordExpires: true,
      verificacionToken: true, verificacionExpira: true,
    },
  });
  if (!usuario) return null;

  if (rotar) {
    const nuevo = tokenNuevo();
    const expiraEn = proximoVencimiento(sesion.creadaEn);
    // La condición sobre tokenHash evita que dos renovaciones simultáneas roten dos veces
    const { count } = await prisma.sesionUsuario.updateMany({
      where: { id: sesion.id, tokenHash: hash },
      data: { tokenHash: hashear(nuevo), tokenAnteriorHash: hash, rotadaEn: ahora, ultimoUso: ahora, expiraEn },
    });
    if (count === 1) guardarCookie(res, nuevo, expiraEn);
  }

  return { token: firmarAcceso(usuario, sesion.id), usuario };
}

async function cerrarSesion(req, res) {
  const token = leerCookie(req);
  if (token) {
    const hash = hashear(token);
    await prisma.sesionUsuario.updateMany({
      where: { OR: [{ tokenHash: hash }, { tokenAnteriorHash: hash }], revocadaEn: null },
      data: { revocadaEn: new Date() },
    });
  }
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie(undefined));
}

// Cierra todas las sesiones de un usuario (por ejemplo, al cambiar la contraseña).
// Con "excepto" se mantiene la sesión desde la que se hizo el cambio.
async function cerrarSesionesDeUsuario(idUsuario, excepto) {
  await prisma.sesionUsuario.updateMany({
    where: { idUsuario, revocadaEn: null, ...(excepto ? { id: { not: excepto } } : {}) },
    data: { revocadaEn: new Date() },
  });
}

// Limpieza: sesiones vencidas o cerradas hace más de un mes
async function borrarSesionesViejas() {
  const limite = new Date(Date.now() - 30 * DIA);
  await prisma.sesionUsuario.deleteMany({
    where: { OR: [{ expiraEn: { lt: limite } }, { revocadaEn: { lt: limite } }] },
  });
}

module.exports = { iniciarSesion, renovarSesion, cerrarSesion, cerrarSesionesDeUsuario, borrarSesionesViejas };

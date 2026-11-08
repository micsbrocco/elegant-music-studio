const prisma = require('../config/prisma');
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { cerrarSesionesDeUsuario } = require('../utils/sesion');
const { errorPassword } = require('../utils/password');

async function obtenerPerfil(req, res) {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { password, resetPasswordToken, resetPasswordExpires, ...perfil } = usuario;
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
}

async function editarPerfil(req, res) {
  try {
    const { nombre, apellido, descripcion, genero } = req.body;

    const generosValidos = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'];
    if (genero && !generosValidos.includes(genero)) {
      return res.status(400).json({ error: 'Género inválido' });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { nombre, apellido, descripcion, genero },
    });

    const { password, resetPasswordToken, resetPasswordExpires, ...perfil } = usuarioActualizado;
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar el perfil' });
  }
}

async function subirFotoPerfil(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const extension = req.file.originalname.split('.').pop();
    const nombreArchivo = `usuario-${req.usuario.id}-${Date.now()}.${extension}`;

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

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { fotoPerfil: dataPublica.publicUrl },
    });

    const { password, resetPasswordToken, resetPasswordExpires, ...perfil } = usuarioActualizado;
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir la foto de perfil' });
  }
}

// Cambio de contraseña desde Configuración: exige la contraseña actual.
async function cambiarPassword(req, res) {
  try {
    const { passwordActual, nuevaPassword } = req.body;

    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({ error: 'Completá la contraseña actual y la nueva' });
    }
    const errorPass = errorPassword(nuevaPassword);
    if (errorPass) {
      return res.status(400).json({ error: errorPass });
    }
    if (nuevaPassword === passwordActual) {
      return res.status(400).json({ error: 'La nueva contraseña tiene que ser distinta de la actual' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const coincide = await bcrypt.compare(passwordActual, usuario.password);
    if (!coincide) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }

    const passwordHasheada = await bcrypt.hash(nuevaPassword, 10);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: passwordHasheada },
    });
    // Se cierran las sesiones de otros dispositivos; esta sigue abierta
    await cerrarSesionesDeUsuario(usuario.id, req.usuario.sid);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
}

async function listarInstructores(req, res) {
  try {
    const instructores = await prisma.usuario.findMany({
      where: { rol: { in: ['admin', 'profesor'] } },
      select: { id: true, nombre: true, apellido: true, rol: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(instructores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar instructores' });
  }
}

// Solo admin: lista alumnos y profesores (nunca a otros admins) para la sección
// "Instructores" del panel, con cuántos cursos creó y en cuántos está asignado
// cada uno como instructor, para poder decidir a quién darle de alta.
// Para la pantalla de Instructores. ?rol=profesor trae los instructores (son
// pocos, van todos). ?rol=alumno trae candidatos para dar de alta: solo
// alumnos activos, buscando por nombre o email y de a 20, para no traer miles
// de filas cuando la base crezca.
async function listarUsuariosParaInstructores(req, res) {
  try {
    const rol = req.query.rol === 'alumno' ? 'alumno' : req.query.rol === 'profesor' ? 'profesor' : null;
    const texto = (req.query.buscar || '').trim();
    const where = { rol: rol ? rol : { in: ['alumno', 'profesor'] } };
    if (rol === 'alumno') where.activo = true;
    if (texto) {
      where.AND = texto.split(/\s+/).slice(0, 4).map((p) => ({
        OR: [
          { nombre: { contains: p, mode: 'insensitive' } },
          { apellido: { contains: p, mode: 'insensitive' } },
          { email: { contains: p, mode: 'insensitive' } },
        ],
      }));
    }
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const porPagina = Math.min(100, Math.max(1, parseInt(req.query.porPagina) || 20));
    const paginar = rol === 'alumno';

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          fotoPerfil: true,
          fechaRegistro: true,
          _count: { select: { cursosCreados: true, colaboraciones: true } },
        },
        orderBy: [{ rol: 'desc' }, { fechaRegistro: 'desc' }],
        ...(paginar ? { skip: (pagina - 1) * porPagina, take: porPagina } : {}),
      }),
      prisma.usuario.count({ where }),
    ]);

    // Para los instructores: desde cuándo lo son (la última alta del registro)
    if (rol === 'profesor' && usuarios.length > 0) {
      const altas = await prisma.historialInstructor.groupBy({
        by: ['idUsuario'],
        where: { accion: 'alta', idUsuario: { in: usuarios.map((u) => u.id) } },
        _max: { fecha: true },
      });
      const fechaDe = Object.fromEntries(altas.map((a) => [a.idUsuario, a._max.fecha]));
      usuarios.forEach((u) => { u.fechaAlta = fechaDe[u.id] || null; });
    }

    // Sin ?rol se mantiene la respuesta de antes (lista simple)
    if (!rol) return res.json(usuarios);
    res.json({ items: usuarios, total, pagina, porPagina: paginar ? porPagina : total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}

async function cambiarRolUsuario(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'El id del usuario no es válido' });
    }
    const { rol } = req.body;

    const rolesValidos = ['alumno', 'profesor'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser: alumno o profesor' });
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (usuarioExistente.rol === 'admin') {
      return res.status(400).json({ error: 'No se puede cambiar el rol de un administrador desde acá' });
    }

    if (usuarioExistente.rol === rol) {
      return res.status(400).json({ error: rol === 'profesor' ? 'Ya es instructor' : 'Ya no es instructor' });
    }

    // El cambio de rol y su registro en el historial van juntos: o se guardan
    // los dos o ninguno.
    const admin = await prisma.usuario.findUnique({ where: { id: req.usuario.id }, select: { nombre: true, apellido: true } });
    const [usuarioActualizado] = await prisma.$transaction([
      prisma.usuario.update({
        where: { id: parseInt(id) },
        data: { rol },
      }),
      prisma.historialInstructor.create({
        data: {
          idUsuario: usuarioExistente.id,
          nombre: `${usuarioExistente.nombre} ${usuarioExistente.apellido}`,
          email: usuarioExistente.email,
          accion: rol === 'profesor' ? 'alta' : 'baja',
          idAdmin: req.usuario.id,
          nombreAdmin: admin ? `${admin.nombre} ${admin.apellido}` : null,
        },
      }),
    ]);

    const { password, resetPasswordToken, resetPasswordExpires, ...resto } = usuarioActualizado;
    res.json(resto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el rol del usuario' });
  }
}

// Solo admin: los cursos de un usuario, separados en los que creó y los que
// comparte como colaborador (con acceso de edición). La base no guarda un
// historial de ediciones, así que "colaborador" es lo más cercano a "editó".
async function listarCursosDeUsuario(req, res) {
  try {
    const idUsuario = parseInt(req.params.id);
    if (isNaN(idUsuario)) {
      return res.status(400).json({ error: 'El id del usuario no es válido' });
    }
    const cursoSelect = { id: true, titulo: true, categoria: true, estado: true, imagenPortada: true };

    const [creados, colaboraciones] = await Promise.all([
      prisma.curso.findMany({
        where: { idAdminCreador: idUsuario },
        select: cursoSelect,
        orderBy: { id: 'desc' },
      }),
      prisma.cursoColaborador.findMany({
        where: { idUsuario },
        select: { visible: true, etiqueta: true, creadoEn: true, curso: { select: cursoSelect } },
        orderBy: { creadoEn: 'desc' },
      }),
    ]);

    res.json({
      creados,
      colaboraciones: colaboraciones.map((c) => ({
        ...c.curso,
        visible: c.visible,
        etiqueta: c.etiqueta,
        desde: c.creadoEn,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los cursos del usuario' });
  }
}

// ---------- Registro de instructores ----------
const { generarExcel, fechaAR, horaAR, textoPeriodo, textoRangoFechas } = require('../utils/excel');

// Filtros: ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&accion=alta|baja&buscar=
// Sin fechas, trae los últimos 12 meses (nunca el registro completo de una).
function whereHistorial(query) {
  const where = {};
  const fecha = {};
  if (query.desde) fecha.gte = new Date(`${query.desde}T00:00:00`);
  if (query.hasta) fecha.lt = new Date(new Date(`${query.hasta}T00:00:00`).getTime() + 24 * 60 * 60 * 1000);
  if (!query.desde && !query.hasta) fecha.gte = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  where.fecha = fecha;
  if (query.accion === 'alta' || query.accion === 'baja') where.accion = query.accion;
  const texto = (query.buscar || '').trim();
  if (texto) {
    where.OR = [
      { nombre: { contains: texto, mode: 'insensitive' } },
      { email: { contains: texto, mode: 'insensitive' } },
    ];
  }
  return where;
}

async function listarHistorialInstructores(req, res) {
  try {
    const where = whereHistorial(req.query);
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const porPagina = Math.min(100, Math.max(1, parseInt(req.query.porPagina) || 10));
    const [items, total] = await Promise.all([
      prisma.historialInstructor.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.historialInstructor.count({ where }),
    ]);
    res.json({ items, total, pagina, porPagina });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial de instructores' });
  }
}

async function exportarHistorialInstructores(req, res) {
  try {
    const registros = await prisma.historialInstructor.findMany({ where: whereHistorial(req.query), orderBy: { fecha: 'desc' } });
    const filas = registros.map((f) => ({
      fecha: fechaAR(f.fecha),
      hora: horaAR(f.fecha),
      accion: f.accion === 'alta' ? 'Alta' : 'Baja',
      nombre: f.nombre,
      email: f.email,
      nombreAdmin: f.nombreAdmin || '—',
      nota: f.nota || '',
    }));

    const periodo = textoPeriodo(req.query) || 'Últimos 12 meses';
    const movimiento = { alta: 'Solo altas', baja: 'Solo bajas' }[req.query.accion] || 'Altas y bajas';
    const busqueda = (req.query.buscar || '').trim();

    await generarExcel(res, {
      nombreArchivo: `historial-instructores-${new Date().toISOString().slice(0, 10)}.xlsx`,
      tituloHoja: 'Registro de instructores',
      titulo: `Registro de instructores · ${periodo}`,
      detalles: [textoRangoFechas(req.query), movimiento, busqueda && `Búsqueda: "${busqueda}"`],
      columnas: [
        { clave: 'fecha', titulo: 'Fecha', ancho: 14 },
        { clave: 'hora', titulo: 'Hora', ancho: 8 },
        { clave: 'accion', titulo: 'Movimiento', ancho: 12 },
        { clave: 'nombre', titulo: 'Instructor', ancho: 26 },
        { clave: 'email', titulo: 'Email', ancho: 32 },
        { clave: 'nombreAdmin', titulo: 'Realizado por', ancho: 22 },
        { clave: 'nota', titulo: 'Nota', ancho: 36 },
      ],
      filas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar el historial de instructores' });
  }
}

module.exports = {
  listarHistorialInstructores,
  exportarHistorialInstructores,
  obtenerPerfil,
  editarPerfil,
  subirFotoPerfil,
  cambiarPassword,
  listarInstructores,
  listarUsuariosParaInstructores,
  cambiarRolUsuario,
  listarCursosDeUsuario,
};
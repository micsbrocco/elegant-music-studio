const prisma = require('../config/prisma');
const supabase = require('../config/supabase');
const { avanceDeInscripcion, evaluarPolitica } = require('../utils/politicaArrepentimiento');
const { INSCRIPCION_VIGENTE } = require('../utils/inscripcionVigente');
const { generarExcel, fechaAR, pesos, textoPeriodo, textoRangoFechas } = require('../utils/excel');

const ESTADOS_PAGO_CONFIRMADO = ['aprobado', 'simulado_aprobado'];
const ESTADOS_PAGO_FALLIDO = ['rechazado', 'cancelado'];
const POR_PAGINA_DEFECTO = 20;
const POR_PAGINA_MAX = 100;

// Lee ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD. "hasta" incluye todo ese día.
function rangoFechas(query) {
  const rango = {};
  if (query.desde) {
    const desde = new Date(`${query.desde}T00:00:00`);
    if (!isNaN(desde)) rango.gte = desde;
  }
  if (query.hasta) {
    const hasta = new Date(`${query.hasta}T00:00:00`);
    if (!isNaN(hasta)) rango.lt = new Date(hasta.getTime() + 24 * 60 * 60 * 1000);
  }
  return Object.keys(rango).length > 0 ? rango : undefined;
}

function paginacion(query) {
  const pagina = Math.max(1, parseInt(query.pagina) || 1);
  const porPagina = Math.min(POR_PAGINA_MAX, Math.max(1, parseInt(query.porPagina) || POR_PAGINA_DEFECTO));
  return { pagina, porPagina, skip: (pagina - 1) * porPagina, take: porPagina };
}

// Búsqueda por nombre, apellido o email (sin distinguir mayúsculas)
function filtroBusquedaUsuario(buscar) {
  const texto = (buscar || '').trim();
  if (!texto) return undefined;
  const palabras = texto.split(/\s+/).slice(0, 4);
  return {
    AND: palabras.map((p) => ({
      OR: [
        { nombre: { contains: p, mode: 'insensitive' } },
        { apellido: { contains: p, mode: 'insensitive' } },
        { email: { contains: p, mode: 'insensitive' } },
      ],
    })),
  };
}

// Filtros de la tabla de ventas: fechas, estado del pago, curso y búsqueda.
// Las inscripciones de "vista previa" nunca son ventas.
function whereVentas(query) {
  const where = { inscripcion: { esVistaPrevia: false } };
  // Siempre se consulta un período: sin fechas, los últimos 30 días
  // (nunca la tabla completa de una).
  const fechas = rangoFechas(query) || { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  where.fechaPago = fechas;

  if (query.estado === 'confirmadas') where.estado = { in: ESTADOS_PAGO_CONFIRMADO };
  else if (query.estado === 'fallidas') where.estado = { in: ESTADOS_PAGO_FALLIDO };
  else if (query.estado === 'pendientes') where.estado = { notIn: [...ESTADOS_PAGO_CONFIRMADO, ...ESTADOS_PAGO_FALLIDO] };

  if (query.curso && !isNaN(parseInt(query.curso))) where.inscripcion.idCurso = parseInt(query.curso);

  // Rango de monto (en pesos), cualquiera de los dos límites es opcional
  const montoMin = parseFloat(query.montoMin);
  const montoMax = parseFloat(query.montoMax);
  if (!isNaN(montoMin) || !isNaN(montoMax)) {
    where.monto = {};
    if (!isNaN(montoMin)) where.monto.gte = montoMin;
    if (!isNaN(montoMax)) where.monto.lte = montoMax;
  }

  const busqueda = (query.buscar || '').trim();
  if (busqueda) {
    where.OR = [
      { inscripcion: { usuario: filtroBusquedaUsuario(busqueda) } },
      { inscripcion: { curso: { titulo: { contains: busqueda, mode: 'insensitive' } } } },
      // Número de operación de Mercado Pago
      { idTransaccionExterna: { contains: busqueda, mode: 'insensitive' } },
    ];
  }
  return where;
}

const ORDEN_VENTAS = {
  fecha_desc: { fechaPago: 'desc' },
  fecha_asc: { fechaPago: 'asc' },
  monto_desc: { monto: 'desc' },
  monto_asc: { monto: 'asc' },
  alumno_asc: { inscripcion: { usuario: { nombre: 'asc' } } },
  alumno_desc: { inscripcion: { usuario: { nombre: 'desc' } } },
  curso_asc: { inscripcion: { curso: { titulo: 'asc' } } },
  curso_desc: { inscripcion: { curso: { titulo: 'desc' } } },
};

// Filtros de la tabla de alumnos: activos/inactivos, fecha de registro y búsqueda
function whereAlumnos(query) {
  const where = { rol: 'alumno' };
  // Activos o inactivos: siempre uno de los dos (no hay "todos")
  where.activo = query.estado !== 'inactivos';
  const fechas = rangoFechas(query);
  if (fechas) where.fechaRegistro = fechas;
  const busqueda = filtroBusquedaUsuario(query.buscar);
  if (busqueda) Object.assign(where, busqueda);
  return where;
}

const ORDEN_ALUMNOS = {
  registro_desc: { fechaRegistro: 'desc' },
  registro_asc: { fechaRegistro: 'asc' },
  actividad_desc: { ultimaActividad: 'desc' },
  actividad_asc: { ultimaActividad: 'asc' },
  nombre_asc: [{ nombre: 'asc' }, { apellido: 'asc' }],
  nombre_desc: [{ nombre: 'desc' }, { apellido: 'desc' }],
  cursos_desc: { inscripciones: { _count: 'desc' } },
};

const SELECT_ALUMNO = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  fotoPerfil: true,
  fechaRegistro: true,
  ultimaActividad: true,
  activo: true,
  _count: { select: { inscripciones: { where: { esVistaPrevia: false, ...INSCRIPCION_VIGENTE } } } },
};

// Inscripciones que cuentan como compra (no vista previa, no devueltas)
const WHERE_INSCRIPCION_ALUMNO = { esVistaPrevia: false, ...INSCRIPCION_VIGENTE };

// Avance (%) de varias inscripciones de una vez: { idInscripcion: porcentaje }
async function avancesDeInscripciones(inscripciones) {
  if (inscripciones.length === 0) return {};
  const cursos = [...new Set(inscripciones.map((i) => i.idCurso))];
  const totales = Object.fromEntries(await Promise.all(cursos.map(async (idCurso) => [
    idCurso,
    await prisma.contenido.count({ where: { visible: true, modulo: { idCurso } } }),
  ])));
  const hechos = await prisma.progreso.groupBy({
    by: ['idInscripcion'],
    where: { idInscripcion: { in: inscripciones.map((i) => i.id) }, completado: true, contenido: { visible: true } },
    _count: { _all: true },
  });
  const completadas = Object.fromEntries(hechos.map((h) => [h.idInscripcion, h._count._all]));
  return Object.fromEntries(inscripciones.map((i) => {
    const total = totales[i.idCurso] || 0;
    const hechas = completadas[i.id] || 0;
    return [i.id, total > 0 ? Math.min(100, Math.round((hechas / total) * 100)) : 0];
  }));
}

function mapearVenta(p) {
  return {
    id: p.id,
    alumno: `${p.inscripcion.usuario.nombre} ${p.inscripcion.usuario.apellido}`,
    email: p.inscripcion.usuario.email,
    fotoAlumno: p.inscripcion.usuario.fotoPerfil,
    curso: p.inscripcion.curso.titulo,
    idCurso: p.inscripcion.curso.id,
    monto: p.monto,
    estado: p.estado,
    fecha: p.fechaPago,
    numeroOperacion: p.idTransaccionExterna,
    completado: p.inscripcion.completado,
  };
}

const INCLUDE_VENTA = {
  inscripcion: {
    include: {
      usuario: { select: { nombre: true, apellido: true, email: true, fotoPerfil: true } },
      curso: { select: { id: true, titulo: true } },
    },
  },
};

function fechaArchivo() {
  return new Date().toISOString().slice(0, 10);
}

async function obtenerResumen(req, res) {
  try {
    const totalAlumnos = await prisma.usuario.count({ where: { rol: 'alumno' } });

    // Alumnos activos: los que usaron la plataforma en los últimos 30 días
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const alumnosActivos30 = await prisma.usuario.count({
      where: { rol: 'alumno', ultimaActividad: { gte: hace30Dias } },
    });

    // Ventas del mes en curso contra el mes anterior completo
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const [ventasMesAgg, ventasMesAnteriorAgg] = await Promise.all([
      prisma.pago.aggregate({
        where: { estado: { in: ESTADOS_PAGO_CONFIRMADO }, fechaPago: { gte: inicioMes }, inscripcion: { esVistaPrevia: false } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.pago.aggregate({
        where: { estado: { in: ESTADOS_PAGO_CONFIRMADO }, fechaPago: { gte: inicioMesAnterior, lt: inicioMes }, inscripcion: { esVistaPrevia: false } },
        _sum: { monto: true },
        _count: true,
      }),
    ]);
    const montoMes = Number(ventasMesAgg._sum.monto || 0);
    const montoMesAnterior = Number(ventasMesAnteriorAgg._sum.monto || 0);
    const ventasMes = {
      monto: montoMes,
      cantidad: ventasMesAgg._count,
      montoMesAnterior,
      cantidadMesAnterior: ventasMesAnteriorAgg._count,
      // null cuando el mes anterior no tuvo ventas (no se puede calcular un %)
      variacionPct: montoMesAnterior > 0 ? Math.round(((montoMes - montoMesAnterior) / montoMesAnterior) * 100) : null,
      mes: inicioMes.toLocaleDateString('es-AR', { month: 'long' }),
    };

    // Los archivados (borrado lógico) no cuentan como cursos del catálogo
    const todosLosCursos = await prisma.curso.findMany({ where: { estado: { not: 'archivado' } }, select: { estado: true } });
    const totalCursos = todosLosCursos.length;
    const cursosPorEstado = {
      activo: todosLosCursos.filter((c) => c.estado === 'activo').length,
      oculto: todosLosCursos.filter((c) => c.estado === 'oculto').length,
      borrador: todosLosCursos.filter((c) => c.estado === 'borrador').length,
    };

    // Las inscripciones de "vista previa" (admin/instructor viendo su curso como
    // alumno, sin comprarlo) no son ventas reales: se excluyen de las métricas.
    const totalInscripciones = await prisma.inscripcion.count({ where: { esVistaPrevia: false } });
    const inscripcionesCompletadas = await prisma.inscripcion.count({ where: { completado: true, esVistaPrevia: false } });
    const inscripcionesCompletadasPct = totalInscripciones > 0
      ? Math.round((inscripcionesCompletadas / totalInscripciones) * 100)
      : 0;
    const promedioInscripcionesPorCursoActivo = cursosPorEstado.activo > 0
      ? Math.round((totalInscripciones / cursosPorEstado.activo) * 10) / 10
      : 0;

    const pagos = await prisma.pago.findMany({
      where: { estado: { in: ESTADOS_PAGO_CONFIRMADO }, inscripcion: { esVistaPrevia: false } },
      select: { monto: true, metodo: true, inscripcion: { select: { idCurso: true } } },
    });
    const ingresosTotales = pagos.reduce((suma, pago) => suma + Number(pago.monto), 0);

    // Medios de pago realmente usados (reemplaza la idea de "pasarelas")
    const conteoMetodos = {};
    pagos.forEach((p) => {
      conteoMetodos[p.metodo] = (conteoMetodos[p.metodo] || 0) + 1;
    });
    const metodosPago = Object.entries(conteoMetodos).map(([metodo, cantidad]) => ({ metodo, cantidad }));

    // Recaudado real por curso, para las tarjetas de "cursos más vendidos"
    const recaudadoPorCurso = {};
    pagos.forEach((p) => {
      const idCurso = p.inscripcion.idCurso;
      recaudadoPorCurso[idCurso] = (recaudadoPorCurso[idCurso] || 0) + Number(p.monto);
    });

    // Top 5 cursos con más inscripciones
    const cursos = await prisma.curso.findMany({
      where: { estado: { not: 'archivado' } },
      include: { _count: { select: { inscripciones: { where: { esVistaPrevia: false } } } } },
      orderBy: { inscripciones: { _count: 'desc' } },
      take: 5,
    });
    const cursosMasVendidos = cursos.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      inscripciones: c._count.inscripciones,
      recaudado: recaudadoPorCurso[c.id] || 0,
    }));

    res.json({
      totalAlumnos,
      alumnosActivos30,
      ventasMes,
      totalCursos,
      cursosPorEstado,
      totalInscripciones,
      inscripcionesCompletadasPct,
      promedioInscripcionesPorCursoActivo,
      ingresosTotales,
      metodosPago,
      cursosMasVendidos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el resumen' });
  }
}

// Ventas agrupadas por período, para el gráfico de "Rendimiento de Ventas & Matrículas"
async function obtenerVentasPeriodo(req, res) {
  try {
    const periodo = req.query.periodo || '30dias';

    // Solo se traen los pagos del último año (lo máximo que muestra el gráfico)
    const ahora = new Date();
    const pagos = await prisma.pago.findMany({
      where: {
        estado: { in: ESTADOS_PAGO_CONFIRMADO },
        inscripcion: { esVistaPrevia: false },
        fechaPago: { gte: new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1) },
      },
      select: { monto: true, fechaPago: true },
    });

    const buckets = [];

    if (periodo === 'anio') {
      for (let i = 11; i >= 0; i--) {
        const desde = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const hasta = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
        buckets.push({ etiqueta: desde.toLocaleDateString('es-AR', { month: 'short' }), desde, hasta });
      }
    } else if (periodo === 'trimestre') {
      for (let i = 2; i >= 0; i--) {
        const desde = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const hasta = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
        buckets.push({ etiqueta: desde.toLocaleDateString('es-AR', { month: 'long' }), desde, hasta });
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        const hasta = new Date(ahora.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const desde = new Date(hasta.getTime() - 7 * 24 * 60 * 60 * 1000);
        buckets.push({ etiqueta: `Semana ${4 - i}`, desde, hasta });
      }
    }

    const resultado = buckets.map((b) => {
      const pagosDelBucket = pagos.filter((p) => {
        const fecha = new Date(p.fechaPago);
        return fecha >= b.desde && fecha < b.hasta;
      });
      return {
        etiqueta: b.etiqueta,
        monto: pagosDelBucket.reduce((suma, p) => suma + Number(p.monto), 0),
        inscripciones: pagosDelBucket.length,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las ventas por período' });
  }
}

// Uso real del bucket "perfiles" de Supabase Storage, contra la cuota del plan free (1 GB)
async function obtenerAlmacenamiento(req, res) {
  try {
    const LIMITE_BYTES = 1024 * 1024 * 1024; // 1 GB - plan free de Supabase

    let bytesUsados = 0;
    let offset = 0;
    const tamanioPagina = 100;
    let quedanMas = true;

    while (quedanMas) {
      const { data, error } = await supabase.storage.from('perfiles').list('', {
        limit: tamanioPagina,
        offset,
      });
      if (error) throw error;
      if (!data || data.length === 0) break;

      data.forEach((archivo) => {
        bytesUsados += archivo.metadata?.size || 0;
      });

      quedanMas = data.length === tamanioPagina;
      offset += tamanioPagina;
    }

    res.json({ bytesUsados, bytesLimite: LIMITE_BYTES });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el uso de almacenamiento' });
  }
}

// Alumnos con filtros y paginación del lado del servidor.
// ?estado=activos|inactivos|todos (por defecto activos) &desde &hasta (fecha de
// registro) &buscar &orden &pagina &porPagina
async function listarAlumnos(req, res) {
  try {
    const where = whereAlumnos(req.query);
    const { pagina, porPagina, skip, take } = paginacion(req.query);
    const orderBy = ORDEN_ALUMNOS[req.query.orden] || ORDEN_ALUMNOS.registro_desc;

    const [alumnos, total, inactivos] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          ...SELECT_ALUMNO,
          // Los cursos que compró, para desplegarlos en la fila
          inscripciones: {
            where: WHERE_INSCRIPCION_ALUMNO,
            orderBy: { fechaInscripcion: 'desc' },
            select: { id: true, idCurso: true, fechaInscripcion: true, completado: true, curso: { select: { titulo: true } } },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.usuario.count({ where }),
      prisma.usuario.count({ where: { rol: 'alumno', activo: false } }),
    ]);

    const avances = await avancesDeInscripciones(alumnos.flatMap((a) => a.inscripciones));
    const items = alumnos.map(({ inscripciones, ...a }) => ({
      ...a,
      cursos: inscripciones.map((i) => ({
        idInscripcion: i.id,
        idCurso: i.idCurso,
        titulo: i.curso.titulo,
        fecha: i.fechaInscripcion,
        completado: i.completado,
        porcentaje: i.completado ? 100 : avances[i.id] ?? 0,
      })),
    }));

    res.json({ items, total, pagina, porPagina, totalInactivos: inactivos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar alumnos' });
  }
}

// El admin vuelve a poner como activo a un alumno inactivo
async function reactivarAlumno(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'El id no es válido' });
    const alumno = await prisma.usuario.update({
      where: { id },
      data: { activo: true, ultimaActividad: new Date() },
      select: SELECT_ALUMNO,
    });
    res.json(alumno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reactivar el alumno' });
  }
}

// Ventas con filtros y paginación del lado del servidor. Además de la página
// pedida devuelve un resumen calculado sobre TODO el filtro (no solo la página):
// total recaudado, ticket promedio, compradores y ventas por curso.
// ?desde &hasta &estado=confirmadas|pendientes|fallidas &curso &montoMin &montoMax &buscar &orden &pagina &porPagina
// Comisión y neto de cada venta. Una operación de Mercado Pago puede incluir
// varios cursos: la comisión se reparte según el precio de cada uno.
// Si no se conoce la comisión (ventas simuladas o anteriores al registro), se
// toma 0 y el neto es el monto completo.
async function operacionesDeVentas(pagos) {
  const ids = [...new Set(pagos.map((p) => p.idTransaccionExterna).filter(Boolean))];
  if (ids.length === 0) return {};
  const operaciones = await prisma.operacionPago.findMany({ where: { idExterno: { in: ids } } });
  return Object.fromEntries(operaciones.map((o) => [o.idExterno, o]));
}

function comisionDeVenta(pago, operacion) {
  const monto = Number(pago.monto);
  if (!operacion || operacion.comision == null || Number(operacion.montoTotal) <= 0) return { comision: 0, neto: monto };
  const comision = Math.round(Number(operacion.comision) * (monto / Number(operacion.montoTotal)) * 100) / 100;
  return { comision, neto: Math.round((monto - comision) * 100) / 100 };
}

async function listarVentas(req, res) {
  try {
    const where = whereVentas(req.query);
    const { pagina, porPagina, skip, take } = paginacion(req.query);
    const orderBy = ORDEN_VENTAS[req.query.orden] || ORDEN_VENTAS.fecha_desc;

    // Para el resumen: mismas condiciones, pero solo pagos confirmados (si se
    // filtró por pendientes o fallidas, no hay nada recaudado que resumir)
    const soloConfirmadas = !req.query.estado || req.query.estado === 'confirmadas';
    const whereConfirmadas = { ...where, estado: { in: soloConfirmadas ? ESTADOS_PAGO_CONFIRMADO : [] } };

    // ?resumen=0: solo la página de la tabla (el historial tiene sus propios
    // filtros y no necesita recalcular las tarjetas de arriba)
    if (req.query.resumen === '0') {
      const [pagos, total] = await Promise.all([
        prisma.pago.findMany({ where, include: INCLUDE_VENTA, orderBy, skip, take }),
        prisma.pago.count({ where }),
      ]);
      return res.json({ items: pagos.map(mapearVenta), total, pagina, porPagina, resumen: null });
    }

    const [pagos, total, confirmadas] = await Promise.all([
      prisma.pago.findMany({ where, include: INCLUDE_VENTA, orderBy, skip, take }),
      prisma.pago.count({ where }),
      prisma.pago.findMany({
        where: whereConfirmadas,
        select: {
          monto: true,
          idTransaccionExterna: true,
          inscripcion: { select: { idUsuario: true, idCurso: true, completado: true, curso: { select: { titulo: true } } } },
        },
      }),
    ]);

    const totalRecaudado = confirmadas.reduce((suma, p) => suma + Number(p.monto), 0);
    const ventasConfirmadas = confirmadas.length;

    const operaciones = await operacionesDeVentas(confirmadas);
    const comisiones = confirmadas.reduce((suma, p) => suma + comisionDeVenta(p, operaciones[p.idTransaccionExterna]).comision, 0);

    // Ventas devueltas al alumno en el mismo período (no suman en lo recaudado)
    const devueltas = await prisma.pago.aggregate({
      where: { ...where, estado: { in: ['reembolsado', 'contracargo'] } },
      _sum: { monto: true },
      _count: true,
    });

    // Ventas por curso dentro del filtro
    const porCursoMapa = {};
    confirmadas.forEach(({ monto, inscripcion: i }) => {
      const item = porCursoMapa[i.idCurso] || {
        idCurso: i.idCurso, curso: i.curso.titulo, total: 0, ventas: 0, alumnos: new Set(), completaron: new Set(),
      };
      item.total += Number(monto);
      item.ventas += 1;
      item.alumnos.add(i.idUsuario);
      if (i.completado) item.completaron.add(i.idUsuario);
      porCursoMapa[i.idCurso] = item;
    });
    const porCurso = Object.values(porCursoMapa)
      .map((c) => ({ ...c, alumnos: c.alumnos.size, completaron: c.completaron.size }))
      .sort((a, b) => b.total - a.total);

    res.json({
      items: pagos.map(mapearVenta),
      total,
      pagina,
      porPagina,
      resumen: {
        totalRecaudado,
        comisiones: Math.round(comisiones * 100) / 100,
        neto: Math.round((totalRecaudado - comisiones) * 100) / 100,
        devuelto: Number(devueltas._sum.monto || 0),
        ventasDevueltas: devueltas._count,
        ventasConfirmadas,
        ticketPromedio: ventasConfirmadas > 0 ? Math.round(totalRecaudado / ventasConfirmadas) : 0,
        alumnosCompradores: new Set(confirmadas.map((p) => p.inscripcion.idUsuario)).size,
        porCurso,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar ventas' });
  }
}

// Detalle del pago de una venta: lo que se ve al hacer clic en una fila
async function obtenerDetalleVenta(req, res) {
  try {
    const id = parseInt(req.params.id);
    const pago = await prisma.pago.findUnique({ where: { id }, include: INCLUDE_VENTA });
    if (!pago || pago.inscripcion.esVistaPrevia) return res.status(404).json({ error: 'Venta no encontrada' });

    let operacion = null;
    let otrosCursos = [];
    if (pago.idTransaccionExterna) {
      [operacion, otrosCursos] = await Promise.all([
        prisma.operacionPago.findUnique({ where: { idExterno: pago.idTransaccionExterna } }),
        prisma.pago.findMany({
          where: { idTransaccionExterna: pago.idTransaccionExterna, id: { not: pago.id } },
          select: { monto: true, inscripcion: { select: { curso: { select: { id: true, titulo: true } } } } },
        }),
      ]);
    }
    const { comision, neto } = comisionDeVenta(pago, operacion);
    // Avance del alumno en el curso y si la compra entra en la política de
    // arrepentimiento (solo se calcula al abrir el detalle de una venta)
    const avance = await avanceDeInscripcion(pago.idInscripcion, pago.inscripcion.curso.id);
    const politica = pago.estado === 'aprobado' || pago.estado === 'simulado_aprobado'
      ? evaluarPolitica(pago.fechaPago, avance.porcentaje)
      : null;

    res.json({
      avance,
      politica,
      ...mapearVenta(pago),
      metodo: pago.metodo,
      comision: operacion?.comision != null ? comision : null,
      neto: operacion?.comision != null ? neto : null,
      operacion: operacion && {
        numero: operacion.idExterno,
        montoTotal: operacion.montoTotal,
        comision: operacion.comision,
        neto: operacion.neto,
        medioPago: operacion.medioPago,
        tipoMedio: operacion.tipoMedio,
        cuotas: operacion.cuotas,
        fecha: operacion.fechaAprobacion,
        fechaAcreditacion: operacion.fechaAcreditacion,
      },
      otrosCursos: otrosCursos.map((o) => ({ ...o.inscripcion.curso, monto: o.monto })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el detalle de la venta' });
  }
}

// Fecha de la primera venta: la usa el atajo "Desde el lanzamiento" de Ventas
async function obtenerPrimeraVenta(req, res) {
  try {
    const primera = await prisma.pago.findFirst({
      where: { estado: { in: ESTADOS_PAGO_CONFIRMADO }, inscripcion: { esVistaPrevia: false } },
      orderBy: { fechaPago: 'asc' },
      select: { fechaPago: true },
    });
    res.json({ fecha: primera?.fechaPago || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la primera venta' });
  }
}

// Cursos para el filtro "Curso" de las tablas (solo id y título)
async function listarCursosParaFiltro(req, res) {
  try {
    const cursos = await prisma.curso.findMany({ select: { id: true, titulo: true, estado: true }, orderBy: { titulo: 'asc' } });
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar los cursos' });
  }
}

// Conviertir 

// Exporta SOLO lo que se está viendo: mismos filtros que la tabla (sin paginar)
async function exportarAlumnosExcel(req, res) {
  try {
    const alumnos = await prisma.usuario.findMany({
      where: whereAlumnos(req.query),
      select: SELECT_ALUMNO,
      orderBy: ORDEN_ALUMNOS[req.query.orden] || ORDEN_ALUMNOS.registro_desc,
    });

    const filas = alumnos.map((a) => ({
      nombre: a.nombre,
      apellido: a.apellido,
      email: a.email,
      fechaRegistro: fechaAR(a.fechaRegistro),
      ultimaActividad: fechaAR(a.ultimaActividad),
      cursosInscriptos: a._count.inscripciones,
    }));

    const inactivos = req.query.estado === 'inactivos';
    const periodo = textoPeriodo(req.query);
    const busqueda = (req.query.buscar || '').trim();

    await generarExcel(res, {
      nombreArchivo: `alumnos-${fechaArchivo()}.xlsx`,
      tituloHoja: 'Alumnos',
      titulo: `Alumnos ${inactivos ? 'inactivos' : 'activos'}${periodo ? ` · Registrados: ${periodo}` : ''}`,
      detalles: [
        periodo && textoRangoFechas(req.query),
        busqueda && `Búsqueda: "${busqueda}"`,
      ],
      columnas: [
        { clave: 'nombre', titulo: 'Nombre', ancho: 18 },
        { clave: 'apellido', titulo: 'Apellido', ancho: 18 },
        { clave: 'email', titulo: 'Email', ancho: 34 },
        { clave: 'fechaRegistro', titulo: 'Fecha de registro', ancho: 18 },
        { clave: 'ultimaActividad', titulo: 'Última actividad', ancho: 18 },
        { clave: 'cursosInscriptos', titulo: 'Cursos inscriptos', ancho: 16 },
      ],
      filas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar alumnos' });
  }
}

const NOMBRE_MEDIO = {
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
  prepaid_card: 'Tarjeta prepaga',
  account_money: 'Dinero en cuenta',
  ticket: 'Efectivo',
  bank_transfer: 'Transferencia',
  digital_currency: 'Mercado Crédito',
};

// El mismo export sirve para "Ventas" y para "Compras" (pantalla de Alumnos)
const TITULOS_VENTAS = ['Ventas', 'Compras'];

async function exportarVentasExcel(req, res) {
  try {
    const pagos = await prisma.pago.findMany({
      where: whereVentas(req.query),
      include: INCLUDE_VENTA,
      orderBy: ORDEN_VENTAS[req.query.orden] || ORDEN_VENTAS.fecha_desc,
    });
    const operaciones = await operacionesDeVentas(pagos);

    let totalCobrado = 0;
    let totalComision = 0;
    const filas = pagos.map((p) => {
      const op = operaciones[p.idTransaccionExterna];
      const { comision, neto } = comisionDeVenta(p, op);
      totalCobrado += Number(p.monto);
      totalComision += comision;
      return {
        fecha: fechaAR(p.fechaPago),
        alumno: `${p.inscripcion.usuario.nombre} ${p.inscripcion.usuario.apellido}`,
        email: p.inscripcion.usuario.email,
        curso: p.inscripcion.curso.titulo,
        monto: Number(p.monto),
        comision: op?.comision != null ? comision : 0,
        neto: op?.comision != null ? neto : Number(p.monto),
        operacion: p.idTransaccionExterna || '',
        medio: op ? [NOMBRE_MEDIO[op.tipoMedio] || op.tipoMedio || '', op.cuotas > 1 ? `${op.cuotas} cuotas` : ''].filter(Boolean).join(' · ') : '',
      };
    });

    // Lo que dice arriba de la tabla: qué se exportó
    const base = TITULOS_VENTAS.includes(req.query.titulo) ? req.query.titulo : 'Ventas';
    const periodo = textoPeriodo(req.query) || 'Últimos 30 días';
    const idCurso = parseInt(req.query.curso);
    const curso = !isNaN(idCurso) ? await prisma.curso.findUnique({ where: { id: idCurso }, select: { titulo: true } }) : null;
    const { montoMin, montoMax } = req.query;
    const textoMonto = montoMin && montoMax ? `Monto: ${pesos(montoMin)} a ${pesos(montoMax)}`
      : montoMin ? `Monto: desde ${pesos(montoMin)}`
        : montoMax ? `Monto: hasta ${pesos(montoMax)}` : '';
    const busqueda = (req.query.buscar || '').trim();
    const slug = (curso?.titulo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    await generarExcel(res, {
      nombreArchivo: `${base.toLowerCase()}${slug ? `-${slug}` : ''}-${fechaArchivo()}.xlsx`,
      tituloHoja: base,
      titulo: `${base}${curso ? ` de "${curso.titulo}"` : ''} · ${periodo}`,
      detalles: [
        textoRangoFechas(req.query),
        curso ? `Curso: ${curso.titulo}` : 'Todos los cursos',
        textoMonto,
        busqueda && `Búsqueda: "${busqueda}"`,
      ],
      columnas: [
        { clave: 'fecha', titulo: 'Fecha', ancho: 12 },
        { clave: 'alumno', titulo: 'Alumno', ancho: 22 },
        { clave: 'email', titulo: 'Email', ancho: 34 },
        { clave: 'curso', titulo: 'Curso', ancho: 30 },
        { clave: 'monto', titulo: 'Cobrado', ancho: 14, moneda: true },
        { clave: 'comision', titulo: 'Comisión MP', ancho: 14, moneda: true },
        { clave: 'neto', titulo: 'Neto', ancho: 14, moneda: true },
        { clave: 'operacion', titulo: 'N° de operación', ancho: 18 },
        { clave: 'medio', titulo: 'Medio de pago', ancho: 24 },
      ],
      filas,
      totales: {
        fecha: 'Total',
        monto: totalCobrado,
        comision: Math.round(totalComision * 100) / 100,
        neto: Math.round((totalCobrado - totalComision) * 100) / 100,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar ventas' });
  }
}


// GET /reportes/cursos-alumnos — cursos con la cantidad de alumnos (para elegir uno)
async function listarCursosConAlumnos(req, res) {
  try {
    const [cursos, conteos] = await Promise.all([
      prisma.curso.findMany({ where: { estado: { not: 'archivado' } }, select: { id: true, titulo: true, estado: true } }),
      prisma.inscripcion.groupBy({ by: ['idCurso'], where: WHERE_INSCRIPCION_ALUMNO, _count: { _all: true } }),
    ]);
    const porCurso = Object.fromEntries(conteos.map((c) => [c.idCurso, c._count._all]));
    const lista = cursos
      .map((c) => ({ ...c, alumnos: porCurso[c.id] || 0 }))
      .sort((a, b) => b.alumnos - a.alumnos || a.titulo.localeCompare(b.titulo));
    res.json(lista);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar los cursos' });
  }
}

const ORDEN_ALUMNOS_CURSO = {
  fecha_desc: { fechaInscripcion: 'desc' },
  fecha_asc: { fechaInscripcion: 'asc' },
  nombre_asc: [{ usuario: { nombre: 'asc' } }, { usuario: { apellido: 'asc' } }],
  nombre_desc: [{ usuario: { nombre: 'desc' } }, { usuario: { apellido: 'desc' } }],
};

// GET /reportes/cursos/:id/alumnos — alumnos de un curso con su avance
// ?progreso=encurso|completaron &buscar &orden &pagina &porPagina
async function listarAlumnosDeCurso(req, res) {
  try {
    const idCurso = parseInt(req.params.id, 10);
    if (Number.isNaN(idCurso)) return res.status(400).json({ error: 'El id no es válido' });
    const { pagina, porPagina, skip, take } = paginacion(req.query);
    const where = { idCurso, ...WHERE_INSCRIPCION_ALUMNO };
    if (req.query.progreso === 'completaron') where.completado = true;
    if (req.query.progreso === 'encurso') where.completado = false;
    const busqueda = filtroBusquedaUsuario(req.query.buscar);
    if (busqueda) where.usuario = busqueda;
    const orderBy = ORDEN_ALUMNOS_CURSO[req.query.orden] || ORDEN_ALUMNOS_CURSO.fecha_desc;

    const [inscripciones, total, completaron] = await Promise.all([
      prisma.inscripcion.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true, idCurso: true, fechaInscripcion: true, completado: true,
          usuario: { select: { id: true, nombre: true, apellido: true, email: true, fotoPerfil: true, ultimaActividad: true } },
        },
      }),
      prisma.inscripcion.count({ where }),
      prisma.inscripcion.count({ where: { idCurso, ...WHERE_INSCRIPCION_ALUMNO, completado: true } }),
    ]);
    const avances = await avancesDeInscripciones(inscripciones);
    const items = inscripciones.map((i) => ({
      idInscripcion: i.id,
      alumno: i.usuario,
      fecha: i.fechaInscripcion,
      completado: i.completado,
      porcentaje: i.completado ? 100 : avances[i.id] ?? 0,
    }));
    res.json({ items, total, pagina, porPagina, completaron });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar los alumnos del curso' });
  }
}

module.exports = {
  listarCursosConAlumnos,
  listarAlumnosDeCurso,
  obtenerResumen,
  obtenerVentasPeriodo,
  obtenerAlmacenamiento,
  listarAlumnos,
  reactivarAlumno,
  listarVentas,
  listarCursosParaFiltro,
  obtenerPrimeraVenta,
  obtenerDetalleVenta,
  exportarAlumnosExcel,
  exportarVentasExcel,
};
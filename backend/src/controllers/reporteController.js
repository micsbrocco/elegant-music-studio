const prisma = require('../config/prisma');
const ExcelJS = require('exceljs');

async function obtenerResumen(req, res) {
  try {
    const totalAlumnos = await prisma.usuario.count({ where: { rol: 'alumno' } });
    const totalCursos = await prisma.curso.count();
    const totalInscripciones = await prisma.inscripcion.count();

    const pagos = await prisma.pago.findMany({
      where: { estado: { in: ['aprobado', 'simulado_aprobado'] } },
      select: { monto: true },
    });
    const ingresosTotales = pagos.reduce((suma, pago) => suma + Number(pago.monto), 0);

    // Top 5 cursos con más inscripciones
    const cursos = await prisma.curso.findMany({
      include: { _count: { select: { inscripciones: true } } },
      orderBy: { inscripciones: { _count: 'desc' } },
      take: 5,
    });
    const cursosMasVendidos = cursos.map((c) => ({
      titulo: c.titulo,
      inscripciones: c._count.inscripciones,
    }));

    res.json({
      totalAlumnos,
      totalCursos,
      totalInscripciones,
      ingresosTotales,
      cursosMasVendidos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el resumen' });
  }
}

async function listarAlumnos(req, res) {
  try {
    const alumnos = await prisma.usuario.findMany({
      where: { rol: 'alumno' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        fechaRegistro: true,
        _count: { select: { inscripciones: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
    });

    res.json(alumnos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar alumnos' });
  }
}

async function listarVentas(req, res) {
  try {
    const pagos = await prisma.pago.findMany({
      include: {
        inscripcion: {
          include: { usuario: true, curso: true },
        },
      },
      orderBy: { fechaPago: 'desc' },
    });

    const ventas = pagos.map((p) => ({
      id: p.id,
      alumno: `${p.inscripcion.usuario.nombre} ${p.inscripcion.usuario.apellido}`,
      email: p.inscripcion.usuario.email,
      curso: p.inscripcion.curso.titulo,
      monto: p.monto,
      estado: p.estado,
      fecha: p.fechaPago,
    }));

    res.json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar ventas' });
  }
}

// Conviertir 
async function generarExcel(res, nombreArchivo, columnas, filas, tituloHoja) {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet(tituloHoja);

  hoja.columns = columnas.map((c) => ({ header: c.titulo, key: c.clave, width: c.ancho || 20 }));

  // Estilo del encabezado: fondo oscuro, texto blanco y en negrita
  hoja.getRow(1).eachCell((celda) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8C6D3F' } };
    celda.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  filas.forEach((fila) => hoja.addRow(fila));

  // Bordes finos en todas las celdas con datos
  hoja.eachRow((row) => {
    row.eachCell((celda) => {
      celda.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);

  await workbook.xlsx.write(res);
  res.end();
}

async function exportarAlumnosExcel(req, res) {
  try {
    const alumnos = await prisma.usuario.findMany({
      where: { rol: 'alumno' },
      select: {
        nombre: true,
        apellido: true,
        email: true,
        fechaRegistro: true,
        _count: { select: { inscripciones: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
    });

    const filas = alumnos.map((a) => ({
      nombre: a.nombre,
      apellido: a.apellido,
      email: a.email,
      fechaRegistro: new Date(a.fechaRegistro).toLocaleDateString('es-AR'),
      cursosInscriptos: a._count.inscripciones,
    }));

    await generarExcel(
      res,
      'alumnos.xlsx',
      [
        { clave: 'nombre', titulo: 'Nombre', ancho: 18 },
        { clave: 'apellido', titulo: 'Apellido', ancho: 18 },
        { clave: 'email', titulo: 'Email', ancho: 28 },
        { clave: 'fechaRegistro', titulo: 'Fecha de registro', ancho: 18 },
        { clave: 'cursosInscriptos', titulo: 'Cursos inscriptos', ancho: 16 },
      ],
      filas,
      'Alumnos'
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar alumnos' });
  }
}

async function exportarVentasExcel(req, res) {
  try {
    const pagos = await prisma.pago.findMany({
      include: { inscripcion: { include: { usuario: true, curso: true } } },
      orderBy: { fechaPago: 'desc' },
    });

    const filas = pagos.map((p) => ({
      alumno: `${p.inscripcion.usuario.nombre} ${p.inscripcion.usuario.apellido}`,
      email: p.inscripcion.usuario.email,
      curso: p.inscripcion.curso.titulo,
      monto: Number(p.monto),
      estado: p.estado,
      fecha: new Date(p.fechaPago).toLocaleDateString('es-AR'),
    }));

    await generarExcel(
      res,
      'ventas.xlsx',
      [
        { clave: 'alumno', titulo: 'Alumno', ancho: 22 },
        { clave: 'email', titulo: 'Email', ancho: 28 },
        { clave: 'curso', titulo: 'Curso', ancho: 24 },
        { clave: 'monto', titulo: 'Monto', ancho: 12 },
        { clave: 'estado', titulo: 'Estado', ancho: 18 },
        { clave: 'fecha', titulo: 'Fecha', ancho: 14 },
      ],
      filas,
      'Ventas'
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar ventas' });
  }
}

module.exports = {
  obtenerResumen,
  listarAlumnos,
  listarVentas,
  exportarAlumnosExcel,
  exportarVentasExcel,
};
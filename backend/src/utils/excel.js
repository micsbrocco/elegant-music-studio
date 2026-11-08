const ExcelJS = require('exceljs');

// Fechas siempre en hora de Argentina (el servidor en la nube corre en UTC)
const ZONA = 'America/Argentina/Buenos_Aires';

function fechaAR(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { timeZone: ZONA });
}
function horaAR(fecha) {
  return new Date(fecha).toLocaleTimeString('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}
// "2026-10-27" → "27/10/2026" (sin pasar por Date, para no correr el día)
function isoAFecha(iso) {
  const [a, m, d] = String(iso).split('-');
  return `${d}/${m}/${a}`;
}
function pesos(valor) {
  return `$${Number(valor).toLocaleString('es-AR')}`;
}

// Texto del período para el título. El panel manda el nombre del atajo que se
// eligió (ej: "Últimos 30 días"); si no viene, se arma con las fechas.
function textoPeriodo(query) {
  const nombre = String(query.periodo || '').trim().slice(0, 60);
  if (nombre) return nombre;
  if (query.desde && query.hasta) return `${isoAFecha(query.desde)} al ${isoAFecha(query.hasta)}`;
  if (query.desde) return `Desde ${isoAFecha(query.desde)}`;
  if (query.hasta) return `Hasta ${isoAFecha(query.hasta)}`;
  return '';
}
function textoRangoFechas(query) {
  if (query.desde && query.hasta) return `Del ${isoAFecha(query.desde)} al ${isoAFecha(query.hasta)}`;
  if (query.desde) return `Desde el ${isoAFecha(query.desde)}`;
  if (query.hasta) return `Hasta el ${isoAFecha(query.hasta)}`;
  return '';
}

const DORADO = 'FF8C6D3F';
const GRIS = 'FF6B6B73';

// Arma y envía el Excel:
//   fila 1: título  ·  fila 2: filtros aplicados  ·  fila 3: cuándo se generó
//   fila 5: encabezados de la tabla y después los datos (+ fila de totales)
async function generarExcel(res, { nombreArchivo, tituloHoja, titulo, detalles = [], columnas, filas, totales }) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet(tituloHoja, {
    views: [{ state: 'frozen', ySplit: 5 }],
    // Al imprimir o guardar como PDF: horizontal y todas las columnas en una hoja de ancho
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  const ultimaColumna = columnas.length;

  hoja.columns = columnas.map((c) => ({ key: c.clave, width: c.ancho || 20 }));

  const filaTitulo = hoja.getRow(1);
  filaTitulo.getCell(1).value = titulo;
  filaTitulo.getCell(1).font = { bold: true, size: 15 };
  filaTitulo.height = 24;

  hoja.getRow(2).getCell(1).value = detalles.filter(Boolean).join('  ·  ');
  hoja.getRow(2).getCell(1).font = { color: { argb: GRIS } };

  const ahora = new Date();
  hoja.getRow(3).getCell(1).value = `Generado el ${fechaAR(ahora)} a las ${horaAR(ahora)} · ${filas.length} ${filas.length === 1 ? 'registro' : 'registros'}`;
  hoja.getRow(3).getCell(1).font = { color: { argb: GRIS }, size: 9 };

  [1, 2, 3].forEach((n) => hoja.mergeCells(n, 1, n, ultimaColumna));

  // Encabezados de la tabla
  const encabezado = hoja.getRow(5);
  columnas.forEach((c, i) => {
    const celda = encabezado.getCell(i + 1);
    celda.value = c.titulo;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DORADO } };
    celda.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  encabezado.height = 20;

  filas.forEach((fila) => hoja.addRow(fila));

  // Montos con formato de pesos
  columnas.forEach((c, i) => {
    if (c.moneda) hoja.getColumn(i + 1).numFmt = '"$"#,##0.00;-"$"#,##0.00';
  });

  if (totales && filas.length > 0) {
    const filaTotal = hoja.addRow({ ...totales });
    filaTotal.font = { bold: true };
  }

  // Bordes finos solo en la tabla (no en el título)
  const ultimaFila = hoja.rowCount;
  for (let r = 5; r <= ultimaFila; r += 1) {
    for (let col = 1; col <= ultimaColumna; col += 1) {
      hoja.getRow(r).getCell(col).border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    }
  }
  // Filtros de Excel en los encabezados
  if (filas.length > 0) hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + filas.length, column: ultimaColumna } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
  await libro.xlsx.write(res);
  res.end();
}

module.exports = { generarExcel, fechaAR, horaAR, pesos, textoPeriodo, textoRangoFechas };

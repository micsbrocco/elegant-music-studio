// Seguimiento de cuánto vio el alumno de una clase de video.
// El video se divide en tramos de 5 segundos; el reproductor avisa qué tramos
// se reprodujeron y se guardan como un texto de "0" y "1" (uno por tramo).
// Adelantar el video no suma: solo cuentan los tramos que realmente se vieron.
// La clase se completa sola al llegar al porcentaje mínimo.

const SEGUNDOS_TRAMO = 5;
const PORCENTAJE_MINIMO = Math.min(100, Math.max(1, parseInt(process.env.VIDEO_PORCENTAJE_MINIMO, 10) || 50));
const DURACION_MAXIMA = 6 * 60 * 60; // 6 horas

// Videos cuyo reproductor permite saber qué se está viendo (YouTube y Bunny
// Stream). Con otros (por ejemplo Vimeo) la clase se sigue completando al avanzar.
function videoConSeguimiento(url) {
  return /(youtube\.com|youtube-nocookie\.com)\/embed\/|(iframe|player)\.mediadelivery\.net\/embed\//i.test(String(url || ''));
}

function porcentajeVisto(tramos) {
  if (!tramos) return 0;
  const vistos = [...tramos].filter((t) => t === '1').length;
  return Math.min(100, Math.round((vistos / tramos.length) * 100));
}

// Suma los tramos nuevos a los ya vistos. Para que no se puedan mandar todos de
// una (trampa), solo se aceptan tantos tramos nuevos como pudieron reproducirse
// desde el aviso anterior (con margen para ver el video a velocidad x2).
function sumarTramos({ tramosAnteriores, ultimoAviso, duracion, tramosNuevos, ahora = new Date() }) {
  const cantidad = Math.max(1, Math.ceil(duracion / SEGUNDOS_TRAMO));
  const actual = (tramosAnteriores || '').padEnd(cantidad, '0').slice(0, cantidad).split('');

  const segundos = ultimoAviso ? (ahora - new Date(ultimoAviso)) / 1000 : 10;
  const permitidos = Math.ceil((Math.min(segundos, 120) * 2) / SEGUNDOS_TRAMO) + 2;

  let agregados = 0;
  [...new Set(tramosNuevos)]
    .filter((i) => Number.isInteger(i) && i >= 0 && i < cantidad && actual[i] === '0')
    .sort((a, b) => a - b)
    .forEach((i) => {
      if (agregados >= permitidos) return;
      actual[i] = '1';
      agregados += 1;
    });

  const tramos = actual.join('');
  return { tramos, porcentaje: porcentajeVisto(tramos) };
}

module.exports = { SEGUNDOS_TRAMO, PORCENTAJE_MINIMO, DURACION_MAXIMA, videoConSeguimiento, porcentajeVisto, sumarTramos };

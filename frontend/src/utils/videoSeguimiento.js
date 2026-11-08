// Videos cuyo reproductor permite saber qué parte se está viendo: YouTube y
// Bunny Stream. Misma regla que el backend (utils/videoVisto.js).
export function proveedorVideo(url) {
  const texto = String(url || '');
  if (/(youtube\.com|youtube-nocookie\.com)\/embed\//i.test(texto)) return 'youtube';
  if (/(iframe|player)\.mediadelivery\.net\/embed\//i.test(texto)) return 'bunny';
  return null;
}

export const videoConSeguimiento = (url) => proveedorVideo(url) !== null;

import { useEffect, useMemo, useRef } from 'react';
import { proveedorVideo } from '../utils/videoSeguimiento';

// Reproductor de una clase. Con YouTube o Bunny Stream, mira qué parte del
// video se está reproduciendo y cada pocos segundos le avisa a la página
// (onAvance) qué tramos de 5 segundos se vieron. Adelantar no suma: solo
// cuentan los tramos por los que el video pasó reproduciéndose.
const SEGUNDOS_TRAMO = 5;
const CADA_CUANTO_AVISAR = 10000; // ms

const scriptsCargados = {};
function cargarScript(src) {
  if (!scriptsCargados[src]) {
    scriptsCargados[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return scriptsCargados[src];
}

function cargarApiYoutube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      anterior?.();
      resolve(window.YT);
    };
    cargarScript('https://www.youtube.com/iframe_api').catch(reject);
  });
}

// YouTube solo avisa si la URL lleva enablejsapi=1
function urlConApi(url, proveedor) {
  if (proveedor !== 'youtube') return url;
  const u = new URL(url, window.location.href);
  u.searchParams.set('enablejsapi', '1');
  u.searchParams.set('origin', window.location.origin);
  return u.toString();
}

function ReproductorClase({ url, titulo, onAvance, seguir = true }) {
  const iframeRef = useRef(null);
  const avanceRef = useRef(onAvance);
  avanceRef.current = onAvance;
  const proveedor = proveedorVideo(url);
  const src = useMemo(() => urlConApi(url, proveedor), [url, proveedor]);

  useEffect(() => {
    if (!seguir || !proveedor || !iframeRef.current) return undefined;
    let cancelado = false;
    let intervaloLectura = null;
    let intervaloAviso = null;
    let reproductorYT = null;
    const pendientes = new Set();
    let duracion = 0;

    function anotar(segundos, total) {
      if (total > 0) duracion = total;
      if (segundos >= 0) pendientes.add(Math.floor(segundos / SEGUNDOS_TRAMO));
    }
    function avisar() {
      if (pendientes.size === 0 || !duracion) return;
      const tramos = [...pendientes];
      pendientes.clear();
      avanceRef.current?.(tramos, duracion);
    }

    if (proveedor === 'youtube') {
      cargarApiYoutube().then((YT) => {
        if (cancelado) return;
        reproductorYT = new YT.Player(iframeRef.current, {
          events: {
            onStateChange: (e) => {
              // Pausa o fin: se avisa enseguida lo que haya
              if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) avisar();
            },
          },
        });
        // Cada segundo, si está reproduciendo, se anota en qué tramo va
        intervaloLectura = setInterval(() => {
          try {
            if (reproductorYT?.getPlayerState?.() === YT.PlayerState.PLAYING) {
              anotar(reproductorYT.getCurrentTime(), reproductorYT.getDuration());
            }
          } catch {
            // el reproductor todavía no está listo
          }
        }, 1000);
      }).catch(() => {});
    } else if (proveedor === 'bunny') {
      cargarScript('https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js').then(() => {
        if (cancelado || !window.playerjs) return;
        const reproductor = new window.playerjs.Player(iframeRef.current);
        reproductor.on('ready', () => {
          reproductor.on('timeupdate', ({ seconds, duration }) => anotar(seconds, duration));
          reproductor.on('pause', avisar);
          reproductor.on('ended', avisar);
        });
      }).catch(() => {});
    }

    intervaloAviso = setInterval(avisar, CADA_CUANTO_AVISAR);

    return () => {
      cancelado = true;
      clearInterval(intervaloLectura);
      clearInterval(intervaloAviso);
      // Al cambiar de clase se manda lo último que se vio. (No se usa destroy()
      // de YouTube porque borra el iframe, y de eso se encarga React.)
      avisar();
    };
  }, [src, proveedor, seguir]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={titulo}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}

export default ReproductorClase;

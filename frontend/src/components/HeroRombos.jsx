import { useEffect, useRef } from 'react';

// Fondo del hero: un ecualizador hecho con rombos, como los del logo.
// Cada columna de rombos sube y baja despacio; cerca del mouse suben un poco más.
// - Se dibuja en un <canvas> (liviano, sin librerías) y queda detrás del contenido.
// - Se pausa cuando el hero no se ve o la pestaña está en segundo plano.
// - Con "reducir movimiento" activado en el sistema, queda quieto.
const PASO = 26; // distancia entre centros de rombos (px)
const LADO = 9; // medio ancho del rombo (px): casi se tocan en las puntas, como en el logo
const MAX_ROMBOS = 9; // altura máxima de una columna

function HeroRombos() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const seccion = canvas?.parentElement;
    if (!canvas || !seccion) return undefined;
    const ctx = canvas.getContext('2d');
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let ancho = 0;
    let alto = 0;
    let columnas = 0;
    let alturas = [];
    let cuadro = null;
    let visible = true;
    let t = 0;
    let ultimo = performance.now();
    const mouse = { x: 0.5, objetivo: 0, fuerza: 0 };

    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = seccion.clientWidth;
      alto = seccion.clientHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columnas = Math.ceil(ancho / PASO) + 1;
      alturas = Array.from({ length: columnas }, (_, i) => alturas[i] ?? 0);
    }

    function rombo(x, y, lado) {
      ctx.beginPath();
      ctx.moveTo(x, y - lado);
      ctx.lineTo(x + lado, y);
      ctx.lineTo(x, y + lado);
      ctx.lineTo(x - lado, y);
      ctx.closePath();
    }

    // Altura "deseada" de cada columna: mezcla de ondas lentas, más alta en el centro
    function objetivo(i) {
      const u = i / (columnas - 1);
      const envolvente = 0.25 + 0.75 * Math.sin(Math.PI * u) ** 1.2;
      const onda = 0.5
        + 0.3 * Math.sin(u * 7 + t * 0.8)
        + 0.2 * Math.sin(u * 17 - t * 1.3 + Math.sin(i * 1.7))
        + 0.12 * Math.sin(t * 2.1 + i * 2.3);
      const cercania = Math.exp(-(((u - mouse.x) / 0.08) ** 2));
      const valor = envolvente * onda + mouse.fuerza * 0.55 * cercania;
      return Math.max(0.05, Math.min(1, valor)) * MAX_ROMBOS;
    }

    function dibujar(dt) {
      ctx.clearRect(0, 0, ancho, alto);
      const base = Math.round(alto - LADO - 10); // pegado al borde de abajo del hero
      const desplazamiento = (ancho - (columnas - 1) * PASO) / 2;

      for (let i = 0; i < columnas; i += 1) {
        // Suavizado: la columna se acerca de a poco a su altura deseada
        alturas[i] += (objetivo(i) - alturas[i]) * Math.min(dt * 4, 1);
        const x = desplazamiento + i * PASO;
        for (let n = 0; n < MAX_ROMBOS; n += 1) {
          const y = base - n * PASO;
          const encendido = Math.max(0, Math.min(1, alturas[i] - n)); // el de arriba se enciende a medias
          // Más fuerte abajo, se apaga hacia arriba
          const alfaEncendido = 0.22 * (1 - n / (MAX_ROMBOS + 2));
          if (encendido <= 0) break; // los apagados no se dibujan: queda la silueta de montañas
          const alfa = encendido * alfaEncendido;
          rombo(x, y, LADO);
          ctx.fillStyle = `rgba(212, 175, 55, ${alfa.toFixed(3)})`;
          ctx.fill();
        }
      }
    }

    function animar(ahora) {
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      t += dt;
      mouse.fuerza += (mouse.objetivo - mouse.fuerza) * Math.min(dt * 3, 1);
      dibujar(dt);
      cuadro = visible ? requestAnimationFrame(animar) : null;
    }

    function arrancar() {
      if (quieto || cuadro || document.hidden || !visible) return;
      ultimo = performance.now();
      cuadro = requestAnimationFrame(animar);
    }
    function frenar() {
      if (cuadro) cancelAnimationFrame(cuadro);
      cuadro = null;
    }
    function alMover(e) {
      const r = seccion.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.objetivo = 1;
    }
    function alSalir() {
      mouse.objetivo = 0;
    }
    function alCambiarPestana() {
      if (document.hidden) frenar();
      else arrancar();
    }

    medir();
    dibujar(1); // primer cuadro ya con las columnas a su altura
    const observadorTamano = new ResizeObserver(() => {
      medir();
      dibujar(1);
    });
    observadorTamano.observe(seccion);
    const observadorVista = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      if (visible) arrancar();
      else frenar();
    });
    observadorVista.observe(seccion);
    seccion.addEventListener('pointermove', alMover);
    seccion.addEventListener('pointerleave', alSalir);
    document.addEventListener('visibilitychange', alCambiarPestana);
    arrancar();

    return () => {
      frenar();
      observadorTamano.disconnect();
      observadorVista.disconnect();
      seccion.removeEventListener('pointermove', alMover);
      seccion.removeEventListener('pointerleave', alSalir);
      document.removeEventListener('visibilitychange', alCambiarPestana);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-ondas" aria-hidden="true" />;
}

export default HeroRombos;

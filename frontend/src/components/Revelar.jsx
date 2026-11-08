import { useEffect, useRef, useState } from 'react';

/* ============================================================
 * Revelar: hace que un elemento aparezca (sube un poco y se desvanece
 * hacia adentro) la primera vez que entra en pantalla al scrollear.
 *
 *  - Se renderiza como el mismo elemento que ya había (prop "as"), con
 *    sus mismas clases y estilos: no agrega capas ni cambia el layout.
 *  - "retraso" (ms) sirve para escalonar tarjetas que aparecen juntas.
 *  - Si el sistema pide menos movimiento, o el navegador no soporta
 *    IntersectionObserver, el contenido se ve directamente.
 *  - Los estilos están en styles/hero-landing.css (.revelar).
 * ============================================================ */

function debeAnimar() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Revelar({ as: Etiqueta = 'div', retraso = 0, className = '', style, children, ...resto }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => !debeAnimar());

  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, [visible]);

  return (
    <Etiqueta
      ref={ref}
      className={`revelar ${visible ? 'visible' : ''} ${className}`.trim()}
      style={{ ...style, '--retraso': `${retraso}ms` }}
      {...resto}
    >
      {children}
    </Etiqueta>
  );
}

export default Revelar;

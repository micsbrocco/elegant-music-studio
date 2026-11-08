import { useLayoutEffect, useRef, useState } from 'react';

// Selector segmentado con una pastilla negra que se desliza hasta la opción
// elegida. Se usa en "Mis cursos" y en el panel de administrador.
// opciones: [{ id, etiqueta }]
function FiltroSegmentado({ opciones, valor, onCambiar, etiqueta = 'Filtrar', className = '' }) {
  const botonesRef = useRef({});
  const [indicador, setIndicador] = useState({ x: 0, ancho: 0, listo: false });

  useLayoutEffect(() => {
    function medir() {
      const boton = botonesRef.current[valor];
      if (!boton) return;
      setIndicador((previo) => ({ x: boton.offsetLeft, ancho: boton.offsetWidth, listo: previo.listo || previo.ancho > 0 }));
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [valor]);

  return (
    <div className={`portal-segmentado ${className}`} role="group" aria-label={etiqueta}>
      <span
        className={`portal-segmento-indicador ${indicador.listo ? 'animado' : ''}`}
        style={{ transform: `translateX(${indicador.x}px)`, width: indicador.ancho }}
        aria-hidden="true"
      />
      {opciones.map((op) => (
        <button
          key={op.id}
          ref={(el) => { botonesRef.current[op.id] = el; }}
          type="button"
          className={`portal-segmento ${valor === op.id ? 'activo' : ''}`}
          onClick={() => onCambiar(op.id)}
          aria-pressed={valor === op.id}
        >
          {op.etiqueta}
        </button>
      ))}
    </div>
  );
}

export default FiltroSegmentado;

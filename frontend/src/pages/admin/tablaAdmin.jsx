import { useState, useEffect, useRef } from 'react';

// Piezas compartidas por las tablas del panel admin: formato de datos, íconos,
// búsqueda normalizada y el botón de ordenar.

// Pesos sin decimales si el monto es redondo; con centavos, siempre dos ($4.109,40)
export function formatearMoneda(valor) {
  const numero = Number(valor || 0);
  const decimales = Number.isInteger(numero) ? 0 : 2;
  return `$${numero.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`;
}

export function IconoBusqueda() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconoDescarga() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
    </svg>
  );
}

export function formatearEstado(estado) {
  const texto = (estado || '').replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Color del estado de un pago: verde aprobado, rojo rechazado/cancelado,
// ámbar pendiente/en proceso, gris el resto.
export function claseEstado(estado) {
  const e = (estado || '').toLowerCase();
  if (['aprobado', 'simulado_aprobado', 'pagado', 'completado', 'acreditado'].includes(e)) return 'admin-tabla-pill--ok';
  if (['rechazado', 'cancelado', 'reembolsado', 'devuelto', 'contracargo'].includes(e)) return 'admin-tabla-pill--error';
  if (['pendiente', 'en_proceso', 'in_process', 'en proceso'].includes(e)) return 'admin-tabla-pill--pendiente';
  return '';
}

// Iniciales + nombre (y un dato secundario opcional) para las tablas de personas
export function CeldaPersona({ nombre, detalle, foto }) {
  const iniciales = (nombre || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <div className="admin-persona">
      <span className="admin-persona-avatar" aria-hidden="true">
        {foto ? <img src={foto} alt="" /> : iniciales}
      </span>
      <span className="admin-persona-datos">
        <span className="admin-persona-nombre">{nombre}</span>
        {detalle && <span className="admin-persona-detalle">{detalle}</span>}
      </span>
    </div>
  );
}

export function ordenar(lista, orden, valores) {
  if (!orden) return lista;
  const obtener = valores[orden.col];
  const signo = orden.dir === 'asc' ? 1 : -1;
  return [...lista].sort((x, y) => {
    const a = obtener(x);
    const b = obtener(y);
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * signo;
    return String(a ?? '').localeCompare(String(b ?? ''), 'es', { sensitivity: 'base' }) * signo;
  });
}

// Ícono de filtros: tres barras con perillas redondas (mismo trazo que el resto
// de los íconos del panel: 24x24, trazo 2, puntas redondeadas).
const FILAS_ICONO = [
  { y: 5, cx: 9 },
  { y: 12, cx: 16 },
  { y: 19, cx: 11 },
];
function IconoOrden() {
  return (
    <svg className="admin-orden-icono" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      {FILAS_ICONO.map((f) => (
        <g key={f.y}>
          <line x1="3" x2={f.cx - 3.6} y1={f.y} y2={f.y} />
          <line x1={f.cx + 3.6} x2="21" y1={f.y} y2={f.y} />
          <circle cx={f.cx} cy={f.y} r="2.7" />
        </g>
      ))}
    </svg>
  );
}

// Botón dentro del buscador que abre la lista de órdenes posibles
export function MenuOrden({ opciones, orden, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    function afuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    function esc(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  const esActiva = (o) => orden?.col === o.col && orden?.dir === o.dir;

  return (
    <div className="admin-orden" ref={ref}>
      <button
        type="button"
        className={`admin-orden-boton ${orden ? 'activo' : ''}`}
        aria-label="Ordenar"
        title="Ordenar"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <IconoOrden />
      </button>
      {abierto && (
        <div className="admin-orden-menu" role="menu">
          {opciones.map((o) => (
            <button
              key={`${o.col}-${o.dir}`}
              type="button"
              role="menuitemradio"
              aria-checked={esActiva(o)}
              className={`admin-orden-opcion ${esActiva(o) ? 'activa' : ''}`}
              onClick={() => { onChange({ col: o.col, dir: o.dir }); setAbierto(false); }}
            >
              {o.etiqueta}
            </button>
          ))}
          {orden && (
            <button type="button" className="admin-orden-opcion admin-orden-quitar" onClick={() => { onChange(null); setAbierto(false); }}>
              Quitar orden
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function normalizar(texto) {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}


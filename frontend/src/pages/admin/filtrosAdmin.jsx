import { useState, useEffect, useRef, useCallback } from 'react';

/* ============================================================
 * Piezas de filtro compartidas por las tablas del panel:
 *  - FiltroFechas: atajos (últimos 7 / 30 días, este mes...) y un rango
 *    "desde / hasta" con calendario
 *  - Paginacion: "1–20 de 340" y flechas
 *  - useListadoAdmin: pide al servidor la página que corresponde a los
 *    filtros, y vuelve a la página 1 cada vez que cambia un filtro
 * ============================================================ */

export const POR_PAGINA = 20;

function aISO(fecha) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

// Siempre se elige un período: no hay opción de "todo el historial", para no
// traer nunca la tabla completa de una.
export const ATAJOS_FECHA = [
  { id: '7d', etiqueta: 'Últimos 7 días' },
  { id: '30d', etiqueta: 'Últimos 30 días' },
  { id: 'mes', etiqueta: 'Este mes' },
  { id: 'mesPasado', etiqueta: 'Mes pasado' },
  { id: 'anio', etiqueta: 'Este año' },
  { id: '12m', etiqueta: 'Últimos 12 meses' },
];

// Convierte un atajo en { desde, hasta } (AAAA-MM-DD). "todo" no tiene límites.
export function rangoDeAtajo(id) {
  const hoy = new Date();
  const dias = (n) => aISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - n));
  switch (id) {
    case '7d': return { desde: dias(6), hasta: aISO(hoy) };
    case '30d': return { desde: dias(29), hasta: aISO(hoy) };
    case 'mes': return { desde: aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: aISO(hoy) };
    case 'mesPasado': return {
      desde: aISO(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
      hasta: aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 0)),
    };
    case 'anio': return { desde: aISO(new Date(hoy.getFullYear(), 0, 1)), hasta: aISO(hoy) };
    case '12m': return { desde: aISO(new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate() + 1)), hasta: aISO(hoy) };
    default: return { desde: '', hasta: '' };
  }
}

export function fechasDeAtajo(id) {
  return { atajo: id, ...rangoDeAtajo(id) };
}

function formatoCorto(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a.slice(2)}`;
}

// Rango de montos { min, max } en pesos (vacío = sin límite)
function textoMonto({ min, max }) {
  const pesos = (v) => `$${Number(v).toLocaleString('es-AR')}`;
  if (min && max) return `${pesos(min)} – ${pesos(max)}`;
  if (min) return `Desde ${pesos(min)}`;
  if (max) return `Hasta ${pesos(max)}`;
  return 'Cualquiera';
}

export function FiltroMonto({ valor, onCambiar, etiqueta = 'Monto' }) {
  const [abierto, setAbierto] = useState(false);
  const [min, setMin] = useState(valor.min || '');
  const [max, setMax] = useState(valor.max || '');
  const ref = useRef(null);

  useEffect(() => {
    setMin(valor.min || '');
    setMax(valor.max || '');
  }, [valor.min, valor.max, abierto]);

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

  const invalido = min !== '' && max !== '' && Number(min) > Number(max);
  const activo = Boolean(valor.min || valor.max);

  function aplicar(e) {
    e.preventDefault();
    if (invalido) return;
    onCambiar({ min, max });
    setAbierto(false);
  }

  function quitar() {
    onCambiar({ min: '', max: '' });
    setAbierto(false);
  }

  return (
    <div className="admin-filtro-fechas" ref={ref}>
      <button
        type="button"
        className={`admin-filtro-boton ${activo ? 'activo' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <span className="admin-filtro-boton-etiqueta">{etiqueta}:</span>
        <span>{textoMonto(valor)}</span>
      </button>
      {abierto && (
        <div className="admin-filtro-pop admin-filtro-pop--simple" role="dialog" aria-label={`Filtrar por ${etiqueta.toLowerCase()}`}>
          <form className="admin-filtro-rango" onSubmit={aplicar}>
            <label>
              Mínimo
              <input type="number" inputMode="numeric" min="0" step="1" placeholder="$ 0" value={min} onChange={(e) => setMin(e.target.value)} />
            </label>
            <label>
              Máximo
              <input type="number" inputMode="numeric" min="0" step="1" placeholder="Sin límite" value={max} onChange={(e) => setMax(e.target.value)} />
            </label>
            {invalido && <p className="admin-filtro-error">El mínimo no puede ser mayor que el máximo.</p>}
            <button type="submit" className="admin-boton-primario admin-filtro-aplicar" disabled={invalido}>
              Aplicar
            </button>
            {activo && (
              <button type="button" className="admin-filtro-quitar" onClick={quitar}>Quitar filtro</button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

function aSlug(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Nombre del Excel según lo que se exporta, ej: "ventas-ultimos-30-dias-2026-10-28.xlsx"
// o "ventas-2026-06-01-a-2026-10-27.xlsx" con un rango personalizado.
export function nombreExportacion(base, fechas, extras = [], ...partes) {
  const atajo = [...ATAJOS_FECHA, ...extras].find((a) => a.id === fechas?.atajo);
  const hoy = aISO(new Date());
  const periodo = atajo
    ? `${aSlug(atajo.etiqueta)}-${hoy}`
    : [fechas?.desde, fechas?.hasta].filter(Boolean).join('-a-') || hoy;
  return `${[base, ...partes.map(aSlug)].filter(Boolean).join('-')}-${periodo}.xlsx`;
}

export function textoRango(fechas, extras = []) {
  const atajo = [...ATAJOS_FECHA, ...extras].find((a) => a.id === fechas.atajo);
  if (atajo) return atajo.etiqueta;
  if (fechas.desde && fechas.hasta) return `${formatoCorto(fechas.desde)} – ${formatoCorto(fechas.hasta)}`;
  if (fechas.desde) return `Desde ${formatoCorto(fechas.desde)}`;
  if (fechas.hasta) return `Hasta ${formatoCorto(fechas.hasta)}`;
  return 'Elegí un período';
}

function IconoCalendario() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconoFlecha({ izquierda }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {izquierda ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

// fechas: { atajo, desde, hasta }
// extras: atajos propios de una pantalla, con su rango ya resuelto
//   (ej: { id: 'inicio', etiqueta: 'Desde el lanzamiento', desde, hasta })
export function FiltroFechas({ fechas, onCambiar, etiqueta = 'Fecha', extras = [] }) {
  const [abierto, setAbierto] = useState(false);
  const [desde, setDesde] = useState(fechas.desde);
  const [hasta, setHasta] = useState(fechas.hasta);
  const ref = useRef(null);

  useEffect(() => {
    setDesde(fechas.desde);
    setHasta(fechas.hasta);
  }, [fechas.desde, fechas.hasta, abierto]);

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

  function elegirAtajo(id) {
    const extra = extras.find((a) => a.id === id);
    onCambiar(extra ? { atajo: id, desde: extra.desde, hasta: extra.hasta } : fechasDeAtajo(id));
    setAbierto(false);
  }

  function aplicarRango(e) {
    e.preventDefault();
    if (desde && hasta && desde > hasta) return;
    onCambiar({ atajo: 'personalizado', desde, hasta });
    setAbierto(false);
  }

  const rangoInvalido = desde && hasta && desde > hasta;

  return (
    <div className="admin-filtro-fechas" ref={ref}>
      <button
        type="button"
        className="admin-filtro-boton"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <IconoCalendario />
        <span className="admin-filtro-boton-etiqueta">{etiqueta}:</span>
        <span>{textoRango(fechas, extras)}</span>
      </button>
      {abierto && (
        <div className="admin-filtro-pop" role="dialog" aria-label={`Filtrar por ${etiqueta.toLowerCase()}`}>
          <div className="admin-filtro-atajos">
            {[...ATAJOS_FECHA, ...extras].map((a) => (
              <button
                key={a.id}
                type="button"
                className={`admin-filtro-atajo ${fechas.atajo === a.id ? 'activo' : ''}`}
                onClick={() => elegirAtajo(a.id)}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
          <form className="admin-filtro-rango" onSubmit={aplicarRango}>
            <p className="admin-filtro-rango-titulo">Rango personalizado</p>
            <label>
              Desde
              <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
            </label>
            <label>
              Hasta
              <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
            </label>
            {rangoInvalido && <p className="admin-filtro-error">"Desde" tiene que ser anterior a "hasta".</p>}
            <button type="submit" className="admin-boton-primario admin-filtro-aplicar" disabled={(!desde && !hasta) || rangoInvalido}>
              Aplicar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Lista desplegable simple con el estilo del panel
export function FiltroSelect({ etiqueta, valor, opciones, onCambiar }) {
  return (
    <label className={`admin-filtro-select ${valor ? 'activo' : ''}`}>
      <span className="admin-filtro-boton-etiqueta">{etiqueta}:</span>
      <select value={valor} onChange={(e) => onCambiar(e.target.value)}>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>{o.etiqueta}</option>
        ))}
      </select>
    </label>
  );
}

// Buscador que espera a que se deje de tipear (para no pedirle al servidor en cada letra)
export function BuscadorDiferido({ valor, onCambiar, placeholder, children }) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  useEffect(() => {
    if (texto === valor) return undefined;
    const t = setTimeout(() => onCambiar(texto), 350);
    return () => clearTimeout(t);
  }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="admin-tabla-busqueda admin-tabla-busqueda--ancha">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input type="text" placeholder={placeholder} value={texto} onChange={(e) => setTexto(e.target.value)} />
      {children}
    </div>
  );
}

export function Paginacion({ pagina, porPagina, total, onCambiar }) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  if (total === 0) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  return (
    <nav className="admin-paginacion" aria-label="Paginación">
      <span className="admin-paginacion-texto">
        {desde}–{hasta} de {total}
      </span>
      {totalPaginas > 1 && (
        <div className="admin-paginacion-botones">
          <button type="button" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
            <IconoFlecha izquierda />
          </button>
          <span className="admin-paginacion-actual">
            {pagina} / {totalPaginas}
          </span>
          <button type="button" aria-label="Página siguiente" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)}>
            <IconoFlecha />
          </button>
        </div>
      )}
    </nav>
  );
}

// Arma los parámetros que entiende el servidor a partir de los filtros de la pantalla
export function aParametros(filtros) {
  const { fechas, pagina, ...resto } = filtros;
  const params = { pagina, porPagina: POR_PAGINA };
  if (fechas?.desde) params.desde = fechas.desde;
  if (fechas?.hasta) params.hasta = fechas.hasta;
  Object.entries(resto).forEach(([clave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[clave] = valor;
  });
  return params;
}

// Pide al servidor la página que corresponde a los filtros actuales
export function useListadoAdmin(pedir, filtrosIniciales) {
  const [filtros, setFiltros] = useState({ ...filtrosIniciales, pagina: 1 });
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const pedidoActual = useRef(0);

  const cargar = useCallback(async () => {
    const id = ++pedidoActual.current;
    setCargando(true);
    try {
      const respuesta = await pedir(aParametros(filtros));
      if (id === pedidoActual.current) {
        setDatos(respuesta);
        setError('');
      }
    } catch (err) {
      if (id === pedidoActual.current) setError('No se pudieron cargar los datos');
    } finally {
      if (id === pedidoActual.current) setCargando(false);
    }
  }, [filtros]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cambiar cualquier filtro vuelve a la página 1 (salvo que se cambie la página)
  function cambiar(cambios) {
    setFiltros((previos) => ({ ...previos, pagina: 1, ...cambios }));
  }

  return { filtros, cambiar, datos, setDatos, cargando, error, recargar: cargar, parametros: aParametros(filtros) };
}

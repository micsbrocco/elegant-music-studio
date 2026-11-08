import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarNotificacionesRequest, marcarNotificacionLeidaRequest, marcarTodasLeidasRequest,
} from '../../services/notificacionService';
import { useAuth } from '../../context/AuthContext';

const CADA_MINUTO = 60 * 1000;

// Filtros de la campana del admin (los grupos están definidos en el backend)
const FILTROS = [
  { id: '', etiqueta: 'Últimas' },
  { id: 'ventas', etiqueta: 'Ventas' },
  { id: 'gestion', etiqueta: 'Gestión' },
  { id: 'preguntas', etiqueta: 'Preguntas' },
];

function IconoCampana() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

// Ícono según el tipo de aviso
function IconoTipo({ tipo }) {
  const trazos = {
    venta: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>,
    arrepentimiento: <><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
    consulta: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  };
  return (
    <span className={`admin-notif-icono admin-notif-icono--${tipo}`} aria-hidden="true">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {trazos[tipo] || <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>}
      </svg>
    </span>
  );
}

function haceCuanto(fecha) {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 1) return 'recién';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return new Date(fecha).toLocaleDateString('es-AR');
}

// Campana del panel: se actualiza sola cada minuto (solo con la pestaña visible)
function CampanaNotificaciones() {
  const navigate = useNavigate();
  const [abierta, setAbierta] = useState(false);
  const [datos, setDatos] = useState({ items: [], noLeidas: 0, noLeidasPorGrupo: {} });
  const [grupo, setGrupo] = useState('');
  const { usuario } = useAuth();
  const conFiltros = usuario?.rol === 'admin';
  const ref = useRef(null);
  const grupoRef = useRef('');
  grupoRef.current = grupo;

  const cargar = useCallback(() => {
    const pedido = grupoRef.current;
    listarNotificacionesRequest(pedido).then((d) => {
      if (grupoRef.current === pedido) setDatos(d);
    }).catch(() => {});
  }, []);

  useEffect(() => { cargar(); }, [grupo, cargar]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible') cargar();
    }, CADA_MINUTO);
    const alVolver = () => { if (document.visibilityState === 'visible') cargar(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [cargar]);

  useEffect(() => {
    if (!abierta) return undefined;
    cargar();
    function afuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierta(false);
    }
    function esc(e) {
      if (e.key === 'Escape') setAbierta(false);
    }
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierta, cargar]);

  async function abrirNotificacion(n) {
    setAbierta(false);
    if (!n.leida) {
      setDatos((d) => ({
        ...d,
        items: d.items.map((x) => (x.id === n.id ? { ...x, leida: true } : x)),
        noLeidas: Math.max(0, d.noLeidas - 1),
      }));
      marcarNotificacionLeidaRequest(n.id).catch(() => {});
    }
    // El state hace que la pantalla se actualice aunque ya estés en esa dirección
    if (n.enlace) navigate(n.enlace, { state: { desdeNotificacion: Date.now() } });
  }

  async function marcarTodas() {
    setDatos((d) => ({ ...d, items: d.items.map((x) => ({ ...x, leida: true })) }));
    marcarTodasLeidasRequest(grupo).then(cargar).catch(() => {});
  }

  const { items, noLeidas } = datos;
  const porGrupo = datos.noLeidasPorGrupo || {};
  const sinLeerEnVista = grupo ? (porGrupo[grupo] || 0) : noLeidas;

  return (
    <div className="admin-topbar-menu" ref={ref}>
      <button
        type="button"
        className="admin-icono-btn admin-campana"
        onClick={() => setAbierta((v) => !v)}
        aria-label={noLeidas > 0 ? `Notificaciones: ${noLeidas} sin leer` : 'Notificaciones'}
        aria-expanded={abierta}
      >
        <IconoCampana />
        {noLeidas > 0 && <span className="admin-campana-contador">{noLeidas > 9 ? '9+' : noLeidas}</span>}
      </button>
      {abierta && (
        <div className="admin-topbar-dropdown admin-notif" role="dialog" aria-label="Notificaciones">
          <div className="admin-notif-cabecera">
            <p>Notificaciones</p>
            {sinLeerEnVista > 0 && (
              <button type="button" className="admin-notif-todas" onClick={marcarTodas}>Marcar todo como leído</button>
            )}
          </div>
          {conFiltros && (
            <div className="admin-notif-filtros" role="tablist" aria-label="Filtrar notificaciones">
              {FILTROS.map((f) => {
                const cantidad = f.id ? porGrupo[f.id] || 0 : 0;
                return (
                  <button
                    key={f.id || 'todas'}
                    type="button"
                    role="tab"
                    aria-selected={grupo === f.id}
                    className={grupo === f.id ? 'activo' : ''}
                    onClick={() => setGrupo(f.id)}
                  >
                    {f.etiqueta}
                    {cantidad > 0 && <span className="admin-notif-filtro-cantidad">{cantidad > 9 ? '9+' : cantidad}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {items.length === 0 ? (
            <p className="admin-topbar-dropdown-vacio admin-notif-vacio">
              {grupo ? `No hay notificaciones de ${FILTROS.find((f) => f.id === grupo).etiqueta.toLowerCase()}.` : 'No tenés notificaciones.'}
            </p>
          ) : (
            <ul className="admin-notif-lista">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`admin-notif-item ${n.leida ? '' : 'sin-leer'}`} onClick={() => abrirNotificacion(n)}>
                    <IconoTipo tipo={n.tipo} />
                    <span className="admin-notif-texto">
                      <span className="admin-notif-titulo">{n.titulo}</span>
                      {n.mensaje && <span className="admin-notif-mensaje">{n.mensaje}</span>}
                      <span className="admin-notif-fecha">{haceCuanto(n.creadaEn)}</span>
                    </span>
                    {!n.leida && <span className="admin-notif-punto" aria-label="Sin leer" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default CampanaNotificaciones;

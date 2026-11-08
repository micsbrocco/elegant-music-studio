import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { obtenerResumenRequest, obtenerVentasPeriodoRequest } from '../../services/reporteService';
import { listarCursosAdminRequest, cambiarEstadoCursoRequest } from '../../services/cursoService';
import TablaCursosAdmin from './TablaCursosAdmin';
import { SkeletonDashboardAdmin } from '../../components/Skeleton';
import FiltroSegmentado from '../../components/FiltroSegmentado';
import { useAuth } from '../../context/AuthContext';

const PERIODOS = [
  { id: '30dias', etiqueta: '30 días' },
  { id: 'trimestre', etiqueta: 'Trimestre' },
  { id: 'anio', etiqueta: 'Año' },
];

function formatearMoneda(valor) {
  return `$${Number(valor || 0).toLocaleString('es-AR')}`;
}

function IconoAlumnos() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconoCursos() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}
function IconoInscripciones() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function IconoIngresos() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function formatearMontoCorto(valor) {
  if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
  if (valor >= 1000) return `$${Math.round(valor / 1000)}k`;
  return `$${Math.round(valor)}`;
}

// Gráfico de línea con ejes cartesianos (reemplaza las barras simples):
// eje Y con grilla y montos, eje X con las etiquetas del período, línea +
// área de relleno, y un tooltip que sigue al punto más cercano al mouse.
function GraficoLineaVentas({ datos }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const ancho = 600;
  const alto = 260;
  const padL = 54;
  const padR = 12;
  const padT = 16;
  const padB = 30;
  const chartW = ancho - padL - padR;
  const chartH = alto - padT - padB;

  const n = datos.length;
  const maxValor = Math.max(1, ...datos.map((d) => d.monto));
  const niveles = [0, 0.25, 0.5, 0.75, 1].map((f) => maxValor * f);

  const posX = (i) => padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
  const posY = (v) => padT + chartH - (v / maxValor) * chartH;

  const puntos = datos.map((d, i) => ({ x: posX(i), y: posY(d.monto), etiqueta: d.etiqueta, monto: d.monto }));
  const lineaPath = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${lineaPath} L${puntos[puntos.length - 1].x},${padT + chartH} L${puntos[0].x},${padT + chartH} Z`;

  function handleMouseMove(e) {
    if (!svgRef.current || n === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * ancho;
    let nearest = 0;
    let nearestDist = Infinity;
    puntos.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
    const escalaX = rect.width / ancho;
    const escalaY = rect.height / alto;
    setTooltipPos({ x: puntos[nearest].x * escalaX, y: puntos[nearest].y * escalaY });
  }

  const activo = hoverIndex !== null ? puntos[hoverIndex] : null;

  return (
    <div className="admin-dash-grafico">
      <svg
        ref={svgRef}
        className="admin-dash-grafico-svg"
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <g className="admin-dash-grafico-grid">
          {niveles.map((v, i) => (
            <line key={i} x1={padL} x2={ancho - padR} y1={posY(v)} y2={posY(v)} />
          ))}
        </g>
        {niveles.map((v, i) => (
          <text key={i} className="admin-dash-grafico-ytick" x={padL - 10} y={posY(v) + 4} textAnchor="end">
            {formatearMontoCorto(v)}
          </text>
        ))}
        <g className="admin-dash-grafico-eje">
          <line x1={padL} x2={padL} y1={padT} y2={padT + chartH} />
          <line x1={padL} x2={ancho - padR} y1={padT + chartH} y2={padT + chartH} />
        </g>
        <path className="admin-dash-grafico-area" d={areaPath} />
        <path className="admin-dash-grafico-linea" d={lineaPath} />
        {hoverIndex !== null && (
          <line
            className="admin-dash-grafico-crosshair"
            x1={puntos[hoverIndex].x}
            x2={puntos[hoverIndex].x}
            y1={padT}
            y2={padT + chartH}
          />
        )}
        {puntos.map((p, i) => (
          <circle
            key={i}
            className={`admin-dash-grafico-punto ${hoverIndex === i ? 'admin-dash-grafico-punto--activo' : ''}`}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 6 : 4}
          />
        ))}
        {puntos.map((p, i) => (
          <text key={i} className="admin-dash-grafico-xtick" x={p.x} y={alto - 6}>
            {p.etiqueta}
          </text>
        ))}
        <rect className="admin-dash-grafico-overlay" x={padL} y={padT} width={chartW} height={chartH} />
      </svg>
      {activo && (
        <div className="admin-dash-grafico-tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y - 14 }}>
          {formatearMoneda(activo.monto)}
          <span className="admin-dash-grafico-tooltip-sub">{activo.etiqueta}</span>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { usuario } = useAuth();
  const [periodo, setPeriodo] = useState('30dias');

  const [resumen, setResumen] = useState(null);
  const [ventasPeriodo, setVentasPeriodo] = useState([]);
  const [cursosAdmin, setCursosAdmin] = useState([]);
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    obtenerVentasPeriodoRequest(periodo).then(setVentasPeriodo).catch(() => {});
  }, [periodo]);

  async function cargarDatos() {
    try {
      const [dataResumen, dataCursos, dataVentasPeriodo] = await Promise.all([
        obtenerResumenRequest(),
        listarCursosAdminRequest({ estado: 'activo', limite: 3 }),
        obtenerVentasPeriodoRequest('30dias'),
      ]);
      setResumen(dataResumen);
      setCursosAdmin(dataCursos);
      setVentasPeriodo(dataVentasPeriodo);
    } catch (err) {
      setError('Error al cargar el dashboard');
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarEstado(curso, nuevoEstado) {
    setCambiandoEstadoId(curso.id);
    try {
      const actualizado = await cambiarEstadoCursoRequest(curso.id, nuevoEstado);
      setCursosAdmin((prev) => prev.map((c) => (c.id === curso.id ? { ...c, estado: actualizado.estado } : c)));
      const dataResumen = await obtenerResumenRequest();
      setResumen(dataResumen);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar el estado del curso');
    } finally {
      setCambiandoEstadoId(null);
    }
  }

  if (cargando) return <SkeletonDashboardAdmin />;
  if (error) return <div className="admin-dash-estado admin-dash-estado--error">{error}</div>;

  const cursosVendidosConMax = resumen.cursosMasVendidos.length > 0
    ? Math.max(...resumen.cursosMasVendidos.map((c) => c.inscripciones), 1)
    : 1;

  return (
    <div className="admin-dash">
      <div className="admin-dash-header">
        <h2>Hola, {usuario?.nombre}</h2>
      </div>

      <div className="admin-dash-stats">
        <div className="admin-dash-stat admin-dash-stat--ingresos">
          <div className="admin-dash-stat-top">
            <div className="admin-dash-stat-icono"><IconoIngresos /></div>
            <div className="admin-dash-stat-texto">
              <p className="admin-dash-stat-valor">
                {formatearMoneda(resumen.ventasMes.monto)}
                {resumen.ventasMes.variacionPct !== null && (
                  <span
                    className={`admin-dash-variacion ${resumen.ventasMes.variacionPct >= 0 ? 'admin-dash-variacion--sube' : 'admin-dash-variacion--baja'}`}
                    title="Comparado con el mes anterior completo"
                  >
                    {resumen.ventasMes.variacionPct >= 0 ? '↑' : '↓'} {Math.abs(resumen.ventasMes.variacionPct)}%
                  </span>
                )}
              </p>
              <p className="admin-dash-stat-titulo">Ventas de {resumen.ventasMes.mes}</p>
            </div>
          </div>
          <p className="admin-dash-stat-nota">
            {resumen.ventasMes.cantidad} venta{resumen.ventasMes.cantidad === 1 ? '' : 's'} · el mes pasado: {formatearMoneda(resumen.ventasMes.montoMesAnterior)}
          </p>
        </div>
        <div className="admin-dash-stat admin-dash-stat--alumnos">
          <div className="admin-dash-stat-top">
            <div className="admin-dash-stat-icono"><IconoAlumnos /></div>
            <div className="admin-dash-stat-texto">
              <p className="admin-dash-stat-valor">
                {resumen.alumnosActivos30} <span className="admin-dash-stat-valor-sub">de {resumen.totalAlumnos}</span>
              </p>
              <p className="admin-dash-stat-titulo">Alumnos activos</p>
            </div>
          </div>
          <p className="admin-dash-stat-nota">Usaron la plataforma en los últimos 30 días</p>
        </div>
        <div className="admin-dash-stat admin-dash-stat--cursos">
          <div className="admin-dash-stat-top">
            <div className="admin-dash-stat-icono"><IconoCursos /></div>
            <div className="admin-dash-stat-texto">
              <p className="admin-dash-stat-valor">{resumen.cursosPorEstado.activo} <span className="admin-dash-stat-valor-sub">activos de {resumen.totalCursos}</span></p>
              <p className="admin-dash-stat-titulo">Cursos en catálogo</p>
            </div>
          </div>
          <p className="admin-dash-stat-nota">
            {resumen.cursosPorEstado.borrador > 0
              ? `${resumen.cursosPorEstado.borrador} borrador${resumen.cursosPorEstado.borrador === 1 ? '' : 'es'}`
              : resumen.cursosPorEstado.oculto > 0
                ? `${resumen.cursosPorEstado.oculto} oculto${resumen.cursosPorEstado.oculto === 1 ? '' : 's'}`
                : 'Sin borradores ni ocultos'}
          </p>
        </div>
        <div className="admin-dash-stat admin-dash-stat--inscripciones">
          <div className="admin-dash-stat-top">
            <div className="admin-dash-stat-icono"><IconoInscripciones /></div>
            <div className="admin-dash-stat-texto">
              <p className="admin-dash-stat-valor">{resumen.totalInscripciones}</p>
              <p className="admin-dash-stat-titulo">Inscripciones totales</p>
            </div>
          </div>
          <p className="admin-dash-stat-nota">
            {resumen.inscripcionesCompletadasPct}% completado · {resumen.promedioInscripcionesPorCursoActivo} por curso activo
          </p>
        </div>
      </div>

      <div className="admin-dash-panel-grid">
        <div className="admin-dash-card">
          <div className="admin-dash-card-header">
            <h3 className="admin-dash-card-titulo">Ventas</h3>
            <FiltroSegmentado
              opciones={PERIODOS}
              valor={periodo}
              onCambiar={setPeriodo}
              etiqueta="Período de ventas"
              className="admin-segmentado"
            />
          </div>
          {ventasPeriodo.every((v) => v.monto === 0) ? (
            <p className="admin-dash-vacio">
              Todavía no hay ventas registradas en este período.
            </p>
          ) : (
            <GraficoLineaVentas datos={ventasPeriodo} />
          )}
        </div>

        <div className="admin-dash-card">
          <h3 className="admin-dash-card-titulo admin-dash-card-titulo--solo">Cursos más vendidos</h3>
          {resumen.cursosMasVendidos.length === 0 ? (
            <p className="admin-dash-vacio admin-dash-vacio--izq">Todavía no hay inscripciones registradas.</p>
          ) : (
            <div className="admin-dash-vendidos-lista">
              {resumen.cursosMasVendidos.map((c, i) => (
                <div key={c.id} className="admin-dash-vendidos-item">
                  <span className="admin-dash-rank">{i + 1}</span>
                  <div className="admin-dash-vendidos-cuerpo">
                    <div className="admin-dash-vendidos-header">
                      <span className="admin-dash-vendidos-titulo">{c.titulo}</span>
                      <span className="admin-dash-vendidos-inscripciones">{c.inscripciones} inscripciones</span>
                    </div>
                    <div className="admin-dash-progreso-track">
                      <div className="admin-dash-progreso-fill" style={{ width: `${(c.inscripciones / cursosVendidosConMax) * 100}%` }} />
                    </div>
                    <p className="admin-dash-vendidos-recaudado">Recaudado: {formatearMoneda(c.recaudado)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-dash-card">
        <div className="admin-dash-card-header">
          <h3 className="admin-dash-card-titulo">
            Últimos cursos publicados
          </h3>
          <Link to="/admin/cursos" className="admin-dash-ver-tabla-link">Ir a cursos</Link>
        </div>
        <div className="admin-dash-tabla">
          <TablaCursosAdmin
            cursos={cursosAdmin}
            onCambiarEstado={handleCambiarEstado}
            cambiandoEstadoId={cambiandoEstadoId}
          />
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;

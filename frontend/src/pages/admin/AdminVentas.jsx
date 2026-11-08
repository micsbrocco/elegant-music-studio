import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarVentasRequest, listarCursosFiltroRequest, obtenerPrimeraVentaRequest, descargarCsv } from '../../services/reporteService';
import {
  formatearMoneda, CeldaPersona, IconoDescarga, MenuOrden,
} from './tablaAdmin';
import {
  FiltroFechas, FiltroSelect, FiltroMonto, BuscadorDiferido, Paginacion, useListadoAdmin, fechasDeAtajo, textoRango, nombreExportacion,
} from './filtrosAdmin';
import { SkeletonVentasAdmin } from '../../components/Skeleton';
import PanelDetalleVenta from './PanelDetalleVenta';
import PanelArrepentimientos from './TarjetaArrepentimientos';
import { listarArrepentimientosRequest } from '../../services/arrepentimientoService';

// col + dir arman la clave de orden que entiende el servidor (ej: fecha_desc)
const OPCIONES_VENTAS = [
  { etiqueta: 'Más recientes', col: 'fecha', dir: 'desc' },
  { etiqueta: 'Más antiguas', col: 'fecha', dir: 'asc' },
  { etiqueta: 'Monto: mayor a menor', col: 'monto', dir: 'desc' },
  { etiqueta: 'Monto: menor a mayor', col: 'monto', dir: 'asc' },
  { etiqueta: 'Alumno (A → Z)', col: 'alumno', dir: 'asc' },
  { etiqueta: 'Alumno (Z → A)', col: 'alumno', dir: 'desc' },
  { etiqueta: 'Curso (A → Z)', col: 'curso', dir: 'asc' },
  { etiqueta: 'Curso (Z → A)', col: 'curso', dir: 'desc' },
];

function IconoVentas() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}
function IconoTicket() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function IconoAlumnos() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}


// Las tarjetas de arriba solo necesitan el resumen; el historial, solo la página
const pedirResumen = (params) => listarVentasRequest({ ...params, porPagina: 1 });
const pedirHistorial = (params) => listarVentasRequest({ ...params, porPagina: 10, resumen: '0' });

function AdminVentas() {
  const [cursos, setCursos] = useState([]);
  // "Desde el lanzamiento": un período más, de la primera venta a hoy. Hay que
  // elegirlo a propósito; por defecto se ven los últimos 30 días.
  const [lanzamiento, setLanzamiento] = useState(null);
  const [ventaAbierta, setVentaAbierta] = useState(null);
  const cerrarDetalle = useCallback(() => setVentaAbierta(null), []);
  // La tarjeta de abajo tiene dos pestañas: ventas y solicitudes de arrepentimiento
  const [pestana, setPestana] = useState('ventas');

  // Desde la campana: ?venta=ID abre el detalle, ?pestana=arrepentimientos
  // muestra las solicitudes. Después se limpia la dirección.
  const [parametrosUrl, setParametrosUrl] = useSearchParams();
  useEffect(() => {
    const venta = parseInt(parametrosUrl.get('venta'), 10);
    const pestanaUrl = parametrosUrl.get('pestana');
    if (!venta && !pestanaUrl) return;
    if (venta) setVentaAbierta(venta);
    if (pestanaUrl === 'arrepentimientos') {
      setPestana('arrepentimientos');
      setTimeout(() => document.querySelector('.admin-pestanas-titulo')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
    setParametrosUrl({}, { replace: true });
  }, [parametrosUrl, setParametrosUrl]);
  const [arrepPendientes, setArrepPendientes] = useState(null);
  const contarArrepentimientos = useCallback(() => {
    listarArrepentimientosRequest({ soloConteo: '1' }).then((d) => setArrepPendientes(d.pendientes)).catch(() => {});
  }, []);
  useEffect(() => { contarArrepentimientos(); }, [contarArrepentimientos]);
  // Siempre se ven las ventas confirmadas (las devueltas no cuentan)
  const { filtros, cambiar, datos, cargando, error } = useListadoAdmin(pedirResumen, {
    fechas: fechasDeAtajo('30d'),
    estado: 'confirmadas',
    curso: '',
  });
  // El historial tiene sus propios filtros, independientes de las tarjetas
  const historial = useListadoAdmin(pedirHistorial, {
    fechas: fechasDeAtajo('7d'),
    estado: 'confirmadas',
    curso: '',
    montoMin: '',
    montoMax: '',
    buscar: '',
    orden: '',
  });

  useEffect(() => {
    listarCursosFiltroRequest().then(setCursos).catch(() => {});
    obtenerPrimeraVentaRequest()
      .then(({ fecha }) => {
        if (fecha) setLanzamiento(new Date(fecha).toISOString().slice(0, 10));
      })
      .catch(() => {});
  }, []);

  if ((!datos && cargando) || (!historial.datos && historial.cargando)) return <SkeletonVentasAdmin />;
  if (!datos || !historial.datos) return <div className="admin-dash-estado admin-dash-estado--error">{error || historial.error}</div>;

  const { resumen } = datos;
  const { items: ventas, total, pagina, porPagina } = historial.datos;
  const extrasFecha = lanzamiento
    ? [{ id: 'inicio', etiqueta: 'Desde el lanzamiento', desde: lanzamiento, hasta: new Date().toISOString().slice(0, 10) }]
    : [];
  const periodo = textoRango(filtros.fechas, extrasFecha).toLowerCase();
  const ordenActual = historial.filtros.orden ? { col: historial.filtros.orden.split('_')[0], dir: historial.filtros.orden.split('_')[1] } : null;
  const { pagina: _p, porPagina: _pp, resumen: _r, ...parametrosExportar } = historial.parametros;
  const opcionesCurso = [{ id: '', etiqueta: 'Cualquier curso' }, ...cursos.map((c) => ({ id: String(c.id), etiqueta: c.titulo }))];

  return (
    <>
      <div className="admin-page-header">
        <h2>Métricas y ventas</h2>
      </div>

      <div className="admin-filtros-barra">
        <FiltroFechas fechas={filtros.fechas} onCambiar={(fechas) => cambiar({ fechas })} etiqueta="Período" extras={extrasFecha} />
        <FiltroSelect
          etiqueta="Curso"
          valor={filtros.curso}
          opciones={opcionesCurso}
          onCambiar={(curso) => cambiar({ curso })}
        />
        {cargando && <span className="admin-filtros-cargando" aria-live="polite">Actualizando…</span>}
      </div>

      <div className={`admin-dash-stats admin-dash-stats--3 ${cargando ? 'admin-actualizando' : ''}`}>
        <div className="admin-dash-stat admin-dash-stat--ingresos">
          <div className="admin-dash-stat-top">
            <div className="admin-dash-stat-icono"><IconoVentas /></div>
            <div className="admin-dash-stat-texto">
              <p className="admin-dash-stat-valor">{formatearMoneda(resumen.totalRecaudado)}</p>
              <p className="admin-dash-stat-titulo">Recaudado</p>
            </div>
          </div>
          <div className="admin-recaudado-desglose">
            <div>
              <span title="Comisión de Mercado Pago">Comisión MP</span>
              <span>−{formatearMoneda(resumen.comisiones)}</span>
            </div>
            <div className="admin-recaudado-neto">
              <span>Neto recibido</span>
              <span>{formatearMoneda(resumen.neto)}</span>
            </div>
          </div>
          <p className="admin-dash-stat-nota">
            {periodo[0].toUpperCase() + periodo.slice(1)}
            {resumen.devuelto > 0 && <> · {formatearMoneda(resumen.devuelto)} devueltos</>}
          </p>
        </div>
        <div className="admin-dash-stat admin-dash-stat--ticket">
          <div className="admin-dash-stat-top">
            <div className="admin-dash-stat-icono"><IconoTicket /></div>
            <div className="admin-dash-stat-texto">
              <p className="admin-dash-stat-valor">{resumen.ventasConfirmadas}</p>
              <p className="admin-dash-stat-titulo">Cantidad de ventas</p>
            </div>
          </div>
          <p className="admin-dash-stat-nota">Confirmadas · {periodo}</p>
        </div>
        <div className="admin-dash-stat admin-dash-stat--alumnos">
          <div className="admin-dash-stat-top">
            <div className="admin-dash-stat-icono"><IconoAlumnos /></div>
            <div className="admin-dash-stat-texto">
              <p className="admin-dash-stat-valor">{resumen.alumnosCompradores}</p>
              <p className="admin-dash-stat-titulo">Alumnos compradores</p>
            </div>
          </div>
          <p className="admin-dash-stat-nota">Que compraron al menos un curso</p>
        </div>
      </div>

      {resumen.porCurso.length > 0 && (
        <div className={`admin-card ${cargando ? 'admin-actualizando' : ''}`}>
          <div className="admin-card-header">
            <h3 className="admin-card-titulo admin-dash-card-titulo">
              Ventas por curso <span className="admin-dash-card-titulo-extra">({resumen.porCurso.length})</span>
            </h3>
          </div>
          <div className="admin-curso-ventas-grid">
            {resumen.porCurso.map((c, i) => (
              <div key={c.idCurso} className={`admin-curso-venta ${i === 0 ? 'admin-curso-venta--top' : ''}`}>
                <p className="admin-curso-venta-titulo" title={c.curso}>{c.curso}</p>
                <p className="admin-curso-venta-total">{formatearMoneda(c.total)}</p>
                <p className="admin-curso-venta-total-label">Total vendido</p>
                <div className="admin-curso-venta-cifras">
                  <div>
                    <span className="admin-curso-venta-cifra">{c.ventas}</span>
                    <span className="admin-curso-venta-cifra-label">{c.ventas === 1 ? 'Venta' : 'Ventas'}</span>
                  </div>
                  <div>
                    <span className="admin-curso-venta-cifra">{c.alumnos}</span>
                    <span className="admin-curso-venta-cifra-label">{c.alumnos === 1 ? 'Alumno inscripto' : 'Alumnos inscriptos'}</span>
                  </div>
                  <div>
                    <span className="admin-curso-venta-cifra">{c.completaron}</span>
                    <span className="admin-curso-venta-cifra-label">{c.completaron === 1 ? 'Completó el curso' : 'Completaron el curso'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-pestanas-titulo" role="tablist" aria-label="Historial">
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'ventas'}
              className={`admin-pestana-titulo ${pestana === 'ventas' ? 'activa' : ''}`}
              onClick={() => setPestana('ventas')}
            >
              Historial de ventas <span className="admin-dash-card-titulo-extra">({total})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'arrepentimientos'}
              className={`admin-pestana-titulo ${pestana === 'arrepentimientos' ? 'activa' : ''}`}
              onClick={() => setPestana('arrepentimientos')}
            >
              Solicitudes de arrepentimiento
              {arrepPendientes > 0 && <span className="admin-arrep-contador" aria-label={`${arrepPendientes} pendientes`}>{arrepPendientes}</span>}
            </button>
          </div>
          {pestana === 'ventas' && (
            <button
            type="button"
            className="admin-tabla-accion admin-tabla-accion--dorada"
            disabled={total === 0}
            title="Exporta solo las ventas que coinciden con los filtros"
            onClick={() => descargarCsv(
              '/reportes/ventas/exportar',
              nombreExportacion('ventas', historial.filtros.fechas, extrasFecha, cursos.find((c) => String(c.id) === historial.filtros.curso)?.titulo),
              { ...parametrosExportar, titulo: 'Ventas', periodo: textoRango(historial.filtros.fechas, extrasFecha) },
            )}
          >
            <IconoDescarga />
            Exportar {total} a Excel
          </button>
          )}
        </div>

        {pestana === 'arrepentimientos' ? (
          <PanelArrepentimientos onVerVenta={setVentaAbierta} onCambio={contarArrepentimientos} />
        ) : (
          <>

          <div className="admin-filtros-barra admin-filtros-barra--card">
            <FiltroFechas fechas={historial.filtros.fechas} onCambiar={(fechas) => historial.cambiar({ fechas })} etiqueta="Período" extras={extrasFecha} />
            <FiltroSelect etiqueta="Curso" valor={historial.filtros.curso} opciones={opcionesCurso} onCambiar={(curso) => historial.cambiar({ curso })} />
            <FiltroMonto
              valor={{ min: historial.filtros.montoMin, max: historial.filtros.montoMax }}
              onCambiar={({ min, max }) => historial.cambiar({ montoMin: min, montoMax: max })}
            />
            {historial.cargando && <span className="admin-filtros-cargando" aria-live="polite">Actualizando…</span>}
          </div>

          <BuscadorDiferido valor={historial.filtros.buscar} onCambiar={(buscar) => historial.cambiar({ buscar })} placeholder="Alumno, curso o N° de operación...">
            <MenuOrden
              opciones={OPCIONES_VENTAS}
              orden={ordenActual}
              onChange={(o) => historial.cambiar({ orden: o ? `${o.col}_${o.dir}` : '' })}
            />
          </BuscadorDiferido>

          {ventas.length === 0 ? (
            <p className="admin-dash-vacio admin-dash-vacio--izq">No hay ventas con estos filtros.</p>
          ) : (
            <div className={`admin-tabla-wrap ${historial.cargando ? 'admin-actualizando' : ''}`}>
              <table className="admin-tabla-cursos">
                <thead>
                  <tr><th>Alumno</th><th>Curso</th><th>Monto</th><th>Fecha</th><th aria-label="Ver detalle" /></tr>
                </thead>
                <tbody>
                  {ventas.map((v) => (
                    <tr
                      key={v.id}
                      className="admin-fila-clic"
                      tabIndex={0}
                      onClick={() => setVentaAbierta(v.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVentaAbierta(v.id); } }}
                    >
                      <td><CeldaPersona nombre={v.alumno} detalle={v.email} foto={v.fotoAlumno} /></td>
                      <td>{v.curso}</td>
                      <td className="admin-tabla-monto">{formatearMoneda(v.monto)}</td>
                      <td>{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                      <td className="admin-fila-clic-flecha" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacion pagina={pagina} porPagina={porPagina} total={total} onCambiar={(p) => historial.cambiar({ pagina: p })} />
          </>
        )}
      </div>

      {ventaAbierta && <PanelDetalleVenta idVenta={ventaAbierta} onCerrar={cerrarDetalle} />}
    </>
  );
}

export default AdminVentas;

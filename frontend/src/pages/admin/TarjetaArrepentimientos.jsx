import { useCallback, useEffect, useState } from 'react';
import { listarArrepentimientosRequest, cambiarEstadoArrepentimientoRequest } from '../../services/arrepentimientoService';
import FiltroSegmentado from '../../components/FiltroSegmentado';
import { formatearMoneda } from './tablaAdmin';
import { Paginacion } from './filtrosAdmin';

function haceCuanto(fecha) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / (24 * 60 * 60 * 1000));
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

// Chip "Entra en la política" / "Fuera de la política"
export function ChipPolitica({ politica }) {
  if (!politica) return null;
  return politica.dentro ? (
    <span className="admin-tabla-pill admin-tabla-pill--ok">Entra en la política</span>
  ) : (
    <span className="admin-tabla-pill admin-tabla-pill--error" title={politica.motivos.join(' y ')}>
      Fuera de la política
    </span>
  );
}

const ESTADOS = {
  pendiente: { texto: 'Pendiente', clase: 'admin-tabla-pill--pendiente' },
  aceptada: { texto: 'Aceptada', clase: 'admin-tabla-pill--ok' },
  rechazada: { texto: 'Rechazada', clase: 'admin-tabla-pill--error' },
};

// Solicitudes del Botón de arrepentimiento (va dentro de la tarjeta del
// historial de ventas, como segunda pestaña). Pendientes: con las compras
// recientes de la persona para decidir. Historial: las aceptadas y rechazadas.
// La devolución de la plata se hace desde Mercado Pago.
function PanelArrepentimientos({ onVerVenta, onCambio }) {
  const [vista, setVista] = useState('pendientes');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [cambiandoId, setCambiandoId] = useState(null);

  const cargar = useCallback(() => {
    listarArrepentimientosRequest({ vista, pagina }).then(setDatos).catch(() => setDatos(null));
  }, [vista, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(solicitud, estado) {
    setCambiandoId(solicitud.id);
    try {
      await cambiarEstadoArrepentimientoRequest(solicitud.id, estado);
      cargar();
      onCambio?.();
    } finally {
      setCambiandoId(null);
    }
  }

  return (
    <div className="admin-arrep">
      <div className="admin-arrep-barra">
        <FiltroSegmentado
          etiqueta="Solicitudes"
          className="admin-segmentado"
          opciones={[
            { id: 'pendientes', etiqueta: 'Pendientes' },
            { id: 'historial', etiqueta: 'Historial' },
          ]}
          valor={vista}
          onCambiar={(v) => { setVista(v); setPagina(1); }}
        />
        {datos && (
          <p className="admin-arrep-politica">
            Política: hasta {datos.politica.diasLimite} días desde la compra y sin haber visto más del {datos.politica.avanceMaximo}% del curso.
          </p>
        )}
      </div>

      {!datos ? (
        <p className="admin-dash-vacio admin-dash-vacio--izq">Cargando…</p>
      ) : datos.items.length === 0 ? (
        <p className="admin-dash-vacio admin-dash-vacio--izq">
          {vista === 'pendientes' ? 'No hay solicitudes pendientes.' : 'Todavía no hay solicitudes aceptadas ni rechazadas.'}
        </p>
      ) : (
        <ul className="admin-arrep-lista">
          {datos.items.map((s) => (
            <li key={s.id} className="admin-arrep-item">
              <div className="admin-arrep-cabecera">
                <div>
                  <p className="admin-arrep-nombre">
                    {s.nombre} <span className="admin-arrep-codigo">{s.codigo}</span>
                    {s.estado !== 'pendiente' && (
                      <span className={`admin-tabla-pill ${ESTADOS[s.estado]?.clase || ''} admin-arrep-estado`}>{ESTADOS[s.estado]?.texto || s.estado}</span>
                    )}
                  </p>
                  <p className="admin-arrep-sub">
                    {s.email} · pedida {haceCuanto(s.creadaEn)}
                    {s.resueltaEn && <> · {s.estado === 'aceptada' ? 'aceptada' : 'rechazada'} el {new Date(s.resueltaEn).toLocaleDateString('es-AR')}</>}
                  </p>
                </div>
                <div className="admin-arrep-acciones">
                  {s.estado === 'pendiente' ? (
                    <>
                      <button type="button" className="admin-instr-boton admin-arrep-aceptar" disabled={cambiandoId === s.id} onClick={() => cambiarEstado(s, 'aceptada')}>
                        Aceptar
                      </button>
                      <button type="button" className="admin-instr-boton admin-instr-boton--quitar" disabled={cambiandoId === s.id} onClick={() => cambiarEstado(s, 'rechazada')}>
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <button type="button" className="admin-filtro-quitar" disabled={cambiandoId === s.id} onClick={() => cambiarEstado(s, 'pendiente')}>
                      Volver a pendiente
                    </button>
                  )}
                </div>
              </div>

              {(s.referencia || s.motivo) && (
                <p className="admin-arrep-texto">
                  {s.referencia && <><strong>Indicó:</strong> {s.referencia}. </>}
                  {s.motivo && <><strong>Motivo:</strong> {s.motivo}</>}
                </p>
              )}

              {s.estado === 'pendiente' && (
                s.compras.length === 0 ? (
                  <p className="admin-arrep-sub">No hay compras recientes con este email.</p>
                ) : (
                  <div className="admin-arrep-compras">
                    {s.compras.map((c) => (
                      <button key={c.idVenta} type="button" className="admin-arrep-compra" onClick={() => onVerVenta(c.idVenta)}>
                        <span className="admin-arrep-compra-curso">{c.curso}</span>
                        <span className="admin-arrep-compra-dato">{formatearMoneda(c.monto)} · {new Date(c.fecha).toLocaleDateString('es-AR')}</span>
                        <span className="admin-arrep-compra-dato">Vio {c.avance.porcentaje}%</span>
                        <ChipPolitica politica={c.politica} />
                      </button>
                    ))}
                  </div>
                )
              )}
            </li>
          ))}
        </ul>
      )}
      {datos && <Paginacion pagina={datos.pagina} porPagina={datos.porPagina} total={datos.total} onCambiar={setPagina} />}
    </div>
  );
}

export default PanelArrepentimientos;

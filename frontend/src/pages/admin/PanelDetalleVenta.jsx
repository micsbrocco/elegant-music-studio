import { useEffect, useState } from 'react';
import { obtenerDetalleVentaRequest } from '../../services/reporteService';
import { formatearMoneda, CeldaPersona } from './tablaAdmin';
import { ChipPolitica } from './TarjetaArrepentimientos';

const TIPO_MEDIO = {
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
  prepaid_card: 'Tarjeta prepaga',
  account_money: 'Dinero en cuenta',
  ticket: 'Efectivo',
  bank_transfer: 'Transferencia',
  digital_currency: 'Mercado Crédito',
};

const MARCA = {
  visa: 'Visa', master: 'Mastercard', amex: 'American Express', naranja: 'Naranja', cabal: 'Cabal',
  maestro: 'Maestro', debvisa: 'Visa', debmaster: 'Mastercard', debcabal: 'Cabal', argencard: 'Argencard',
};

function fechaHora(fecha) {
  return new Date(fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Fila({ etiqueta, children, destacada }) {
  return (
    <div className={`admin-detalle-fila ${destacada ? 'admin-detalle-fila--destacada' : ''}`}>
      <span className="admin-detalle-etiqueta">{etiqueta}</span>
      <span className="admin-detalle-valor">{children}</span>
    </div>
  );
}

// Panel lateral con el detalle del pago de una venta
function PanelDetalleVenta({ idVenta, onCerrar }) {
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setDetalle(null);
    setError('');
    obtenerDetalleVentaRequest(idVenta)
      .then(setDetalle)
      .catch(() => setError('No se pudo cargar el detalle de esta venta.'));
  }, [idVenta]);

  useEffect(() => {
    const alPresionar = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  async function copiarNumero() {
    try {
      await navigator.clipboard.writeText(detalle.numeroOperacion);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch { /* sin permiso para copiar: no pasa nada */ }
  }

  const op = detalle?.operacion;
  const medio = op ? [TIPO_MEDIO[op.tipoMedio] || op.tipoMedio, MARCA[op.medioPago], op.cuotas > 1 ? `${op.cuotas} cuotas` : null].filter(Boolean).join(' · ') : null;
  const variosCursos = detalle?.otrosCursos?.length > 0;

  return (
    <div className="admin-detalle-fondo" onClick={onCerrar}>
      <aside className="admin-detalle" role="dialog" aria-modal="true" aria-labelledby="detalle-venta-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="admin-detalle-cabecera">
          <h3 id="detalle-venta-titulo">Detalle de la venta</h3>
          <button type="button" className="admin-modal-cerrar" aria-label="Cerrar" onClick={onCerrar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {error && <p className="admin-dash-estado admin-dash-estado--error">{error}</p>}
        {!detalle && !error && <p className="admin-detalle-cargando">Cargando…</p>}

        {detalle && (
          <div className="admin-detalle-cuerpo">
            <div className="admin-detalle-bloque">
              <CeldaPersona nombre={detalle.alumno} detalle={detalle.email} foto={detalle.fotoAlumno} />
              <p className="admin-detalle-curso">{detalle.curso}</p>
            </div>

            {detalle.avance && (
              <div className="admin-detalle-bloque">
                <Fila etiqueta="Avance en el curso">
                  {detalle.avance.total > 0
                    ? `${detalle.avance.completadas} de ${detalle.avance.total} clases (${detalle.avance.porcentaje}%)`
                    : 'El curso no tiene clases'}
                </Fila>
                <div className="admin-detalle-barra" aria-hidden="true">
                  <span style={{ width: `${detalle.avance.porcentaje}%` }} />
                </div>
                {detalle.politica && (
                  <>
                    <Fila etiqueta="Arrepentimiento">
                      <ChipPolitica politica={detalle.politica} />
                    </Fila>
                    <p className="admin-detalle-nota">
                      {detalle.politica.dentro
                        ? `Le quedan ${detalle.politica.diasRestantes} ${detalle.politica.diasRestantes === 1 ? 'día' : 'días'} para arrepentirse.`
                        : `No entra porque ${detalle.politica.motivos.join(' y ')}.`}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="admin-detalle-bloque">
              <Fila etiqueta="Cobrado">{formatearMoneda(detalle.monto)}</Fila>
              <Fila etiqueta="Comisión de Mercado Pago">{detalle.comision != null ? `−${formatearMoneda(detalle.comision)}` : '—'}</Fila>
              <Fila etiqueta="Neto recibido" destacada>{formatearMoneda(detalle.neto ?? detalle.monto)}</Fila>
            </div>

            <div className="admin-detalle-bloque">
              <Fila etiqueta="N° de operación">
                {detalle.numeroOperacion ? (
                  <button type="button" className="admin-detalle-copiar" onClick={copiarNumero} title="Copiar número">
                    {detalle.numeroOperacion}
                    <span className="admin-detalle-copiar-aviso">{copiado ? 'Copiado' : 'Copiar'}</span>
                  </button>
                ) : 'Sin operación de Mercado Pago'}
              </Fila>
              <Fila etiqueta="Fecha">{fechaHora(op?.fecha || detalle.fecha)}</Fila>
              {medio && <Fila etiqueta="Medio de pago">{medio}</Fila>}
              {op?.fechaAcreditacion && <Fila etiqueta="Plata disponible desde">{new Date(op.fechaAcreditacion).toLocaleDateString('es-AR')}</Fila>}
            </div>

            {variosCursos && (
              <div className="admin-detalle-bloque">
                <p className="admin-detalle-subtitulo">En la misma compra</p>
                {detalle.otrosCursos.map((c) => (
                  <Fila key={c.id} etiqueta={c.titulo}>{formatearMoneda(c.monto)}</Fila>
                ))}
                <Fila etiqueta="Total de la operación">{formatearMoneda(op?.montoTotal)}</Fila>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

export default PanelDetalleVenta;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { misComprasRequest } from '../services/pagoService';

const METODOS = {
  mercadopago: 'Mercado Pago',
  simulado: 'Compra de prueba',
};

const ESTADOS_APROBADOS = ['aprobado', 'simulado_aprobado'];

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function etiquetaEstado(estado) {
  if (ESTADOS_APROBADOS.includes(estado)) return 'Aprobado';
  return estado ? estado.charAt(0).toUpperCase() + estado.slice(1).replace(/_/g, ' ') : '—';
}

function MisCompras() {
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarCompras();
  }, []);

  async function cargarCompras() {
    try {
      const data = await misComprasRequest();
      setCompras(data);
    } catch (err) {
      setError('No se pudieron cargar tus compras');
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return <p className="text-muted">Cargando...</p>;
  }

  const aprobadas = compras.filter((c) => ESTADOS_APROBADOS.includes(c.estado));
  const total = aprobadas.reduce((suma, c) => suma + Number(c.monto), 0);

  return (
    <div className="cuenta-seccion">
        <div className="cuenta-seccion-cab">
          <h2 className="cuenta-seccion-titulo">Mis compras</h2>
          <p className="cuenta-seccion-sub">
            {compras.length === 0
              ? 'Todavía no hiciste ninguna compra.'
              : `${compras.length} compra${compras.length === 1 ? '' : 's'} · Total ${formatearMonto(total)}`}
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {!error && compras.length === 0 ? (
          <div className="portal-vacio">
            <p className="text-muted">Cuando compres un curso, vas a ver acá el detalle de cada pago.</p>
            <Link to="/cursos" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="cuenta-lista">
            {compras.map((compra) => (
              <div key={compra.id} className="cuenta-fila">
                <div className="cuenta-thumb">
                  {compra.curso.imagenPortada && (
                    <img src={compra.curso.imagenPortada} alt="" />
                  )}
                </div>

                <div className="cuenta-info">
                  <Link to={`/cursos/${compra.curso.id}`} className="cuenta-titulo">
                    {compra.curso.titulo}
                  </Link>
                  <p className="cuenta-meta">
                    {formatearFecha(compra.fechaPago)} · {METODOS[compra.metodo] || compra.metodo}
                    {compra.idTransaccionExterna ? ` · Operación ${compra.idTransaccionExterna}` : ''}
                  </p>
                </div>

                <div className="cuenta-lado">
                  <span className="cuenta-monto">{formatearMonto(compra.monto)}</span>
                  <span className={`cuenta-pill ${ESTADOS_APROBADOS.includes(compra.estado) ? 'cuenta-pill--ok' : ''}`}>
                    {etiquetaEstado(compra.estado)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default MisCompras;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ModalPagina from './ModalPagina';
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
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function etiquetaEstado(estado) {
  if (ESTADOS_APROBADOS.includes(estado)) return 'Aprobado';
  return estado ? estado.charAt(0).toUpperCase() + estado.slice(1).replace(/_/g, ' ') : '—';
}

// Historial de compras en una ventana sobre la página (reemplaza a la página Mis compras).
function ModalCompras() {
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    misComprasRequest()
      .then((data) => setCompras([...data].sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))))
      .catch(() => setError('No se pudieron cargar tus compras'))
      .finally(() => setCargando(false));
  }, []);

  const total = compras
    .filter((c) => ESTADOS_APROBADOS.includes(c.estado))
    .reduce((suma, c) => suma + Number(c.monto), 0);

  return (
    <ModalPagina titulo="Mis compras" ancho={600}>
      {cargando ? (
        <p className="modal-texto-suave">Cargando...</p>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : compras.length === 0 ? (
        <div className="modal-vacio">
          <p className="modal-texto-suave">Cuando compres un curso, vas a ver acá el detalle de cada pago.</p>
          <Link to="/cursos" className="btn btn-primary">Ver catálogo</Link>
        </div>
      ) : (
        <>
          <p className="modal-texto-suave modal-compras-resumen">
            {compras.length} compra{compras.length === 1 ? '' : 's'} · Total {formatearMonto(total)}
          </p>
          <ul className="modal-compras-lista">
            {compras.map((compra) => (
              <li key={compra.id} className="modal-compra">
                <div className="modal-compra-thumb">
                  {compra.curso.imagenPortada && <img src={compra.curso.imagenPortada} alt="" />}
                </div>
                <div className="modal-compra-info">
                  <Link to={`/cursos/${compra.curso.id}`} className="modal-compra-titulo">{compra.curso.titulo}</Link>
                  <p className="modal-compra-meta">
                    {formatearFecha(compra.fechaPago)} · {METODOS[compra.metodo] || compra.metodo}
                  </p>
                </div>
                <div className="modal-compra-lado">
                  <span className="modal-compra-monto">{formatearMonto(compra.monto)}</span>
                  <span className={`modal-compra-estado ${ESTADOS_APROBADOS.includes(compra.estado) ? 'modal-compra-estado--ok' : ''}`}>
                    {etiquetaEstado(compra.estado)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </ModalPagina>
  );
}

export default ModalCompras;

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verCarritoRequest, quitarDelCarritoRequest } from '../services/carritoService';
import { crearPreferenciaRequest } from '../services/pagoService';
import { obtenerCarritoInvitado, quitarDelCarritoInvitado } from '../services/carritoInvitado';
import { obtenerCursoRequest } from '../services/cursoService';
import { useAuth } from '../context/AuthContext';
import PortadaCurso from '../components/PortadaCurso';
import { SkeletonLista } from '../components/Skeleton';

function formatearPrecio(valor) {
  return Number(valor).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

const IconoCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconoCandado = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

// Resumen de la compra: se revisa lo que hay en el carrito y de acá se va a
// pagar a Mercado Pago.
function Carrito() {
  const { usuario } = useAuth();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    cargarCarrito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function cargarCarrito() {
    setCargando(true);
    try {
      if (usuario) {
        const data = await verCarritoRequest();
        setItems(data);
      } else {
        // Sin sesión: el "carrito" es solo una lista de IDs en este navegador.
        // Buscamos los datos de cada curso para poder mostrarlos igual.
        const ids = obtenerCarritoInvitado();
        const cursos = await Promise.all(
          ids.map((id) =>
            obtenerCursoRequest(id)
              .then((curso) => ({ id: curso.id, curso }))
              .catch(() => null) // el curso pudo haber sido borrado mientras tanto
          )
        );
        setItems(cursos.filter(Boolean));
      }
    } catch (err) {
      setError('Error al cargar el carrito');
    } finally {
      setCargando(false);
    }
  }

  async function handleQuitar(id) {
    if (!usuario) {
      quitarDelCarritoInvitado(id);
      setItems(items.filter((item) => item.id !== id));
      return;
    }
    try {
      await quitarDelCarritoRequest(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      setError('No se pudo quitar el curso del carrito');
    }
  }

  async function handlePagar() {
    setComprando(true);
    setError('');
    try {
      const { initPoint } = await crearPreferenciaRequest(items.map((item) => item.curso.id));
      window.location.href = initPoint;
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar el pago. Probá de nuevo.');
      setComprando(false);
    }
  }

  if (cargando) return <SkeletonLista filas={3} />;

  const subtotal = items.reduce((suma, item) => {
    const original = Number(item.curso.precioOriginal) > Number(item.curso.precio) ? Number(item.curso.precioOriginal) : Number(item.curso.precio);
    return suma + original;
  }, 0);
  const total = items.reduce((suma, item) => suma + Number(item.curso.precio), 0);
  const descuento = subtotal - total;
  const conCertificado = items.some((item) => item.curso.emiteCertificado !== false);

  return (
    <div className="checkout-page">
      <div className="container checkout-contenedor">
        <nav className="checkout-migas">
          <Link to="/cursos">Cursos</Link> <span>/</span> <span>Resumen de compra</span>
        </nav>
        <h1 className="checkout-titulo">Resumen de compra</h1>

        {items.length === 0 ? (
          <div className="checkout-vacio">
            <p>Tu carrito está vacío.</p>
            <Link to="/cursos" className="btn btn-primary" style={{ textDecoration: 'none' }}>Ver cursos</Link>
          </div>
        ) : (
          <div className="checkout-grid">
            <section className="checkout-items" aria-label="Cursos del carrito">
              <p className="checkout-subtitulo">{items.length} {items.length === 1 ? 'curso' : 'cursos'}</p>
              <ul>
                {items.map((item) => {
                  const { curso } = item;
                  const conDescuento = Number(curso.precioOriginal) > Number(curso.precio);
                  return (
                    <li key={item.id} className="checkout-item">
                      <Link to={`/cursos/${curso.id}`} className="checkout-item-portada">
                        <PortadaCurso curso={curso} />
                      </Link>
                      <div className="checkout-item-datos">
                        <div className="checkout-item-chips">
                          {curso.categoria && <span className="cd-chip cd-chip--dorado">{curso.categoria}</span>}
                          {curso.nivel && <span className="cd-chip">{curso.nivel}</span>}
                        </div>
                        <Link to={`/cursos/${curso.id}`} className="checkout-item-titulo">{curso.titulo}</Link>
                        <button type="button" className="checkout-item-quitar" onClick={() => handleQuitar(item.id)}>Quitar</button>
                      </div>
                      <div className="checkout-item-precio">
                        <span>{formatearPrecio(curso.precio)}</span>
                        {conDescuento && <s>{formatearPrecio(curso.precioOriginal)}</s>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link to="/cursos" className="checkout-seguir">← Seguir viendo cursos</Link>
            </section>

            <aside className="checkout-resumen">
              <div className="checkout-tarjeta">
                <p className="checkout-tarjeta-titulo">Tu pedido</p>
                <div className="checkout-fila">
                  <span>Subtotal</span>
                  <span>{formatearPrecio(subtotal)}</span>
                </div>
                {descuento > 0 && (
                  <div className="checkout-fila checkout-fila--descuento">
                    <span>Descuentos</span>
                    <span>−{formatearPrecio(descuento)}</span>
                  </div>
                )}
                <div className="checkout-fila checkout-fila--total">
                  <span>Total</span>
                  <span>{formatearPrecio(total)}</span>
                </div>

                <ul className="checkout-incluye">
                  <li><IconoCheck /> Acceso de por vida {items.length === 1 ? 'al curso' : 'a los cursos'}</li>
                  {conCertificado && <li><IconoCheck /> Certificado al terminar</li>}
                  <li><IconoCheck /> Preguntas privadas a los instructores</li>
                </ul>

                {error && <div className="error-box checkout-error">{error}</div>}

                {usuario ? (
                  <button type="button" className="btn btn-primary checkout-pagar" onClick={handlePagar} disabled={comprando}>
                    {comprando ? 'Te llevamos a Mercado Pago…' : `Pagar ${formatearPrecio(total)}`}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary checkout-pagar"
                    onClick={() => navigate('/login', { state: { backgroundLocation: location } })}
                  >
                    Iniciá sesión para pagar
                  </button>
                )}
                <p className="checkout-seguro">
                  <IconoCandado /> Pagás en Mercado Pago, de forma segura: tarjeta de crédito, débito o dinero en cuenta.
                </p>
              </div>

            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default Carrito;

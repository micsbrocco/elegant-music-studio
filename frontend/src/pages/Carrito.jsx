import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verCarritoRequest, quitarDelCarritoRequest, comprarCarritoRequest } from '../services/carritoService';

function Carrito() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    cargarCarrito();
  }, []);

  async function cargarCarrito() {
    try {
      const data = await verCarritoRequest();
      setItems(data);
    } catch (err) {
      setError('Error al cargar el carrito');
    } finally {
      setCargando(false);
    }
  }

  async function handleQuitar(id) {
    try {
      await quitarDelCarritoRequest(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      alert('Error al quitar el curso del carrito');
    }
  }

  async function handleComprar() {
    setComprando(true);
    setError('');
    try {
      await comprarCarritoRequest();
      navigate('/mis-cursos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la compra');
    } finally {
      setComprando(false);
    }
  }

  if (cargando) return <p>Cargando carrito...</p>;

  const total = items.reduce((suma, item) => suma + Number(item.curso.precio), 0);

  return (
    <div>
      <h2>Mi carrito</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {items.length === 0 ? (
        <p>
          Tu carrito está vacío. <Link to="/cursos">Ver catálogo</Link>
        </p>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid #ccc', padding: '0.5rem 0' }}>
              <strong>{item.curso.titulo}</strong> — ${item.curso.precio}
              {' '}
              <button onClick={() => handleQuitar(item.id)}>Quitar</button>
            </div>
          ))}

          <p><strong>Total: ${total}</strong></p>

          <button onClick={handleComprar} disabled={comprando}>
            {comprando ? 'Procesando...' : 'Confirmar compra'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Carrito;
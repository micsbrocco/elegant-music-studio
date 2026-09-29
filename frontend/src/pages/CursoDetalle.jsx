import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { obtenerCursoRequest } from '../services/cursoService';
import { comprarCursoRequest, verificarInscripcionRequest } from '../services/inscripcionService';
import { agregarAlCarritoRequest } from '../services/carritoService';
import { agregarFavoritoRequest } from '../services/favoritoService';
import { useAuth } from '../context/AuthContext';

function CursoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [curso, setCurso] = useState(null);
  const [inscripto, setInscripto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [id, usuario]);

  async function cargarDatos() {
    try {
      const dataCurso = await obtenerCursoRequest(id);
      setCurso(dataCurso);

      if (usuario) {
        const dataInscripcion = await verificarInscripcionRequest(id);
        setInscripto(dataInscripcion.inscripto);
      }
    } catch (err) {
      setError('No se pudo cargar el curso');
    } finally {
      setCargando(false);
    }
  }

  async function handleComprar() {
    setComprando(true);
    setError('');
    try {
      await comprarCursoRequest(id);
      setInscripto(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la compra');
    } finally {
      setComprando(false);
    }
  }

  async function handleAgregarCarrito() {
    setMensaje('');
    setError('');
    try {
      await agregarAlCarritoRequest(id);
      setMensaje('Curso agregado al carrito');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar al carrito');
    }
  }

  async function handleAgregarFavorito() {
    setMensaje('');
    setError('');
    try {
      await agregarFavoritoRequest(id);
      setMensaje('Curso agregado a favoritos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar a favoritos');
    }
  }

  if (cargando) return <p>Cargando curso...</p>;
  if (!curso) return <p>Curso no encontrado</p>;

  return (
    <div>
      <h2>{curso.titulo}</h2>
      <p>{curso.categoria}</p>
      <p>{curso.descripcion}</p>
      <p><strong>Precio: ${curso.precio}</strong></p>
      <p>{curso.modulos.length} módulos</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

      {!usuario && <p>Necesitás <Link to="/login">iniciar sesión</Link> para comprar este curso.</p>}

      {usuario && inscripto && (
        <div>
          <p>✅ Ya estás inscripto en este curso.</p>
          <Link to={`/cursos/${id}/aprender`}>
            <button>Ir al curso</button>
          </Link>
        </div>
      )}

      {usuario && !inscripto && (
        <div>
          <button onClick={handleComprar} disabled={comprando}>
            {comprando ? 'Procesando...' : 'Comprar ahora'}
          </button>
          {' '}
          <button onClick={handleAgregarCarrito}>Agregar al carrito</button>
          {' '}
          <button onClick={handleAgregarFavorito}>♡ Agregar a favoritos</button>
        </div>
      )}

      <h3>Contenido del curso</h3>
      <ul>
        {curso.modulos
          .sort((a, b) => a.orden - b.orden)
          .map((modulo) => (
            <li key={modulo.id}>
              [{modulo.tipo}] {modulo.titulo}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default CursoDetalle;
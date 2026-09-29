import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarCursosRequest } from '../services/cursoService';
import { agregarAlCarritoRequest } from '../services/carritoService';
import { agregarFavoritoRequest } from '../services/favoritoService';
import { useAuth } from '../context/AuthContext';

function CatalogoCursos({ limite = null }) {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarCursos();
  }, []);

  async function cargarCursos() {
    try {
      const data = await listarCursosRequest();
      setCursos(limite ? data.slice(0, limite) : data);
    } catch (err) {
      setError('Error al cargar los cursos');
    } finally {
      setCargando(false);
    }
  }

  async function handleAgregarCarrito(cursoId) {
    setMensaje('');
    try {
      await agregarAlCarritoRequest(cursoId);
      setMensaje('Curso agregado al carrito');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al agregar al carrito');
    }
  }

  async function handleAgregarFavorito(cursoId) {
    setMensaje('');
    try {
      await agregarFavoritoRequest(cursoId);
      setMensaje('Curso agregado a favoritos');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al agregar a favoritos');
    }
  }

  if (cargando) return <p className="text-muted">Cargando cursos...</p>;
  if (error) return <p className="error-box">{error}</p>;
  if (cursos.length === 0) return <p className="text-muted">Todavía no hay cursos disponibles.</p>;

  return (
    <div>
      {mensaje && <div className="success-box" style={{ maxWidth: 400 }}>{mensaje}</div>}

      <div className="courses-grid">
        {cursos.map((curso) => (
          <div key={curso.id} className="course-card">
            {curso.imagenPortada && (
              <div className="course-card-image">
                <img src={curso.imagenPortada} alt={curso.titulo} />
              </div>
            )}

            <div className="course-card-body">
              <span className="course-card-tag">{curso.categoria}</span>

              <h3 className="course-card-title">{curso.titulo}</h3>
              <p className="text-muted course-card-desc">
                {curso.descripcion.slice(0, 90)}{curso.descripcion.length > 90 ? '...' : ''}
              </p>

              <div className="course-card-footer">
                <div>
                  <span className="course-card-price-label">Matrícula</span>
                  <span className="course-card-price">${curso.precio}</span>
                </div>
                <Link to={`/cursos/${curso.id}`} className="course-card-cta">
                  Ver curso
                  <span className="hero-btn-arrow">→</span>
                </Link>
              </div>

              {usuario && (
                <div className="course-card-actions">
                  <button onClick={() => handleAgregarCarrito(curso.id)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    🛒 Agregar
                  </button>
                  <button onClick={() => handleAgregarFavorito(curso.id)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    ♡ Favorito
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CatalogoCursos;
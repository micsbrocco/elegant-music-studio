import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { verFavoritosRequest, quitarFavoritoRequest } from '../services/favoritoService';
import { SkeletonLista } from '../components/Skeleton';

function Favoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarFavoritos();
  }, []);

  async function cargarFavoritos() {
    try {
      const data = await verFavoritosRequest();
      setFavoritos(data);
    } catch (err) {
      setError('Error al cargar tus favoritos');
    } finally {
      setCargando(false);
    }
  }

  async function handleQuitar(id) {
    try {
      await quitarFavoritoRequest(id);
      setFavoritos(favoritos.filter((f) => f.id !== id));
    } catch (err) {
      alert('Error al quitar de favoritos');
    }
  }

  if (cargando) return <SkeletonLista filas={3} />;

  return (
    <div>
      <h2>Mis favoritos</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {favoritos.length === 0 ? (
        <p>
          Todavía no agregaste cursos a favoritos. <Link to="/cursos">Ver catálogo</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {favoritos.map((favorito) => (
            <div
              key={favorito.id}
              style={{ border: '1px solid #ccc', padding: '1rem', width: '250px' }}
            >
              <h3>{favorito.curso.titulo}</h3>
              <p>${favorito.curso.precio}</p>
              <Link to={`/cursos/${favorito.curso.id}`}>
                <button>Ver curso</button>
              </Link>
              {' '}
              <button onClick={() => handleQuitar(favorito.id)}>Quitar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favoritos;
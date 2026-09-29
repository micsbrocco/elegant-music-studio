import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarCursosRequest, eliminarCursoRequest } from '../../services/cursoService';

function AdminCursos() {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarCursos();
  }, []);

  async function cargarCursos() {
    try {
      const data = await listarCursosRequest();
      setCursos(data);
    } catch (err) {
      setError('Error al cargar los cursos');
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminar(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar este curso? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
      await eliminarCursoRequest(id);
      setCursos(cursos.filter((c) => c.id !== id)); // sacamos el curso de la lista sin recargar todo
    } catch (err) {
      alert('Error al eliminar el curso');
    }
  }

  if (cargando) return <p>Cargando cursos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Panel de Administrador - Cursos</h2>
      <Link to="/admin/cursos/nuevo">
        <button>+ Crear curso nuevo</button>
      </Link>

      {cursos.length === 0 ? (
        <p>Todavía no hay cursos creados.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ marginTop: '1rem', width: '100%' }}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((curso) => (
              <tr key={curso.id}>
                <td>{curso.titulo}</td>
                <td>{curso.categoria}</td>
                <td>${curso.precio}</td>
                <td>
                  <Link to={`/admin/cursos/${curso.id}/editar`}>Editar</Link>
                  {' | '}
                  <Link to={`/admin/cursos/${curso.id}/modulos`}>Módulos</Link>
                  {' | '}
                  <button onClick={() => handleEliminar(curso.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminCursos;
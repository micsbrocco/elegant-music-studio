import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerCursoRequest } from '../../services/cursoService';
import { crearModuloRequest, eliminarModuloRequest, reordenarModuloRequest } from '../../services/moduloService';

function AdminModulos() {
  const { cursoId } = useParams();
  const [curso, setCurso] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [titulo, setTitulo] = useState('');

  useEffect(() => {
    cargarCurso();
  }, [cursoId]);

  async function cargarCurso() {
    try {
      const data = await obtenerCursoRequest(cursoId);
      setCurso(data);
    } catch (err) {
      setError('Error al cargar el curso');
    } finally {
      setCargando(false);
    }
  }

  async function handleAgregarModulo(e) {
    e.preventDefault();
    const siguienteOrden = curso.modulos.length + 1;

    try {
      await crearModuloRequest(cursoId, { titulo, orden: siguienteOrden });
      setTitulo('');
      cargarCurso();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear el módulo');
    }
  }

  async function handleEliminarModulo(id) {
    const confirmar = window.confirm('¿Eliminar este módulo y todo su contenido?');
    if (!confirmar) return;

    try {
      await eliminarModuloRequest(id);
      cargarCurso();
    } catch (err) {
      alert('Error al eliminar el módulo');
    }
  }

  async function handleReordenar(id, direccion) {
    try {
      await reordenarModuloRequest(id, direccion);
      cargarCurso();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reordenar el módulo');
    }
  }

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const modulosOrdenados = [...curso.modulos].sort((a, b) => a.orden - b.orden);

  return (
    <div>
      <Link to="/admin/cursos">← Volver a cursos</Link>
      <h2>Módulos de: {curso.titulo}</h2>

      <ul>
        {modulosOrdenados.map((modulo, index) => (
          <li key={modulo.id}>
            <button onClick={() => handleReordenar(modulo.id, 'subir')} disabled={index === 0}>▲</button>
            <button onClick={() => handleReordenar(modulo.id, 'bajar')} disabled={index === modulosOrdenados.length - 1}>▼</button>
            {' '}
            [{modulo.orden}] {modulo.titulo}
            {' '}
            <Link to={`/admin/modulos/${modulo.id}/contenidos`}>Gestionar contenidos</Link>
            {' '}
            <button onClick={() => handleEliminarModulo(modulo.id)}>Eliminar</button>
          </li>
        ))}
      </ul>

      <h3>Agregar nuevo módulo</h3>
      <form onSubmit={handleAgregarModulo}>
        <div>
          <label>Título del módulo</label>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <button type="submit">Agregar módulo</button>
      </form>
    </div>
  );
}

export default AdminModulos;
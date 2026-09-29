import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerModuloRequest, editarModuloRequest } from '../../services/moduloService';

function ModuloForm() {
  const { id } = useParams();
  const [titulo, setTitulo] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    cargarModulo();
  }, [id]);

  async function cargarModulo() {
    try {
      const modulo = await obtenerModuloRequest(id);
      setTitulo(modulo.titulo);
    } catch (err) {
      setError('Error al cargar el módulo');
    } finally {
      setCargandoDatos(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await editarModuloRequest(id, { titulo });
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al editar el módulo');
    }
  }

  if (cargandoDatos) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Editar módulo</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Título del módulo</label>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}

export default ModuloForm;
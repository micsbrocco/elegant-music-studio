import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearCursoRequest, editarCursoRequest, obtenerCursoRequest } from '../../services/cursoService';

function CursoForm() {
  const { id } = useParams(); // si hay id en la URL, estamos editando
  const esEdicion = Boolean(id);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(esEdicion);

  const navigate = useNavigate();

  useEffect(() => {
    if (esEdicion) {
      cargarCurso();
    }
  }, [id]);

  async function cargarCurso() {
    try {
      const curso = await obtenerCursoRequest(id);
      setTitulo(curso.titulo);
      setDescripcion(curso.descripcion);
      setPrecio(curso.precio);
      setCategoria(curso.categoria);
    } catch (err) {
      setError('Error al cargar el curso');
    } finally {
      setCargandoDatos(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const datosCurso = {
      titulo,
      descripcion,
      precio: parseFloat(precio),
      categoria,
    };

    try {
      if (esEdicion) {
        await editarCursoRequest(id, datosCurso);
      } else {
        await crearCursoRequest(datosCurso);
      }
      navigate('/admin/cursos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el curso');
    } finally {
      setCargando(false);
    }
  }

  if (cargandoDatos) return <p>Cargando datos del curso...</p>;

  return (
    <div>
      <h2>{esEdicion ? 'Editar curso' : 'Crear nuevo curso'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Título</label>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div>
          <label>Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        </div>
        <div>
          <label>Precio</label>
          <input
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Categoría</label>
          <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear curso'}
        </button>
      </form>
    </div>
  );
}

export default CursoForm;
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerModuloRequest } from '../../services/moduloService';
import {
  crearContenidoRequest,
  eliminarContenidoRequest,
  reordenarContenidoRequest,
} from '../../services/contenidoService';

function AdminContenidos() {
  const { moduloId } = useParams();
  const [modulo, setModulo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('video');
  const [urlVideo, setUrlVideo] = useState('');
  const [contenidoTexto, setContenidoTexto] = useState('');

  useEffect(() => {
    cargarModulo();
  }, [moduloId]);

  async function cargarModulo() {
    try {
      const data = await obtenerModuloRequest(moduloId);
      setModulo(data);
    } catch (err) {
      setError('Error al cargar el módulo');
    } finally {
      setCargando(false);
    }
  }

  async function handleAgregarContenido(e) {
    e.preventDefault();
    const siguienteOrden = modulo.contenidos.length + 1;

    try {
      await crearContenidoRequest(moduloId, {
        titulo,
        orden: siguienteOrden,
        tipo,
        urlVideo: tipo === 'video' ? urlVideo : undefined,
        contenidoTexto: tipo === 'texto' ? contenidoTexto : undefined,
      });
      setTitulo('');
      setUrlVideo('');
      setContenidoTexto('');
      cargarModulo();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear el contenido');
    }
  }

  async function handleEliminar(id) {
    const confirmar = window.confirm('¿Eliminar este contenido?');
    if (!confirmar) return;

    try {
      await eliminarContenidoRequest(id);
      cargarModulo();
    } catch (err) {
      alert('Error al eliminar el contenido');
    }
  }

  async function handleReordenar(id, direccion) {
    try {
      await reordenarContenidoRequest(id, direccion);
      cargarModulo();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reordenar');
    }
  }

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const contenidosOrdenados = [...modulo.contenidos].sort((a, b) => a.orden - b.orden);

  return (
    <div>
      <Link to={`/admin/cursos/${modulo.idCurso}/modulos`}>← Volver a módulos</Link>
      <h2>Contenidos de: {modulo.titulo}</h2>

      <ul>
        {contenidosOrdenados.map((contenido, index) => (
          <li key={contenido.id}>
            <button onClick={() => handleReordenar(contenido.id, 'subir')} disabled={index === 0}>▲</button>
            <button onClick={() => handleReordenar(contenido.id, 'bajar')} disabled={index === contenidosOrdenados.length - 1}>▼</button>
            {' '}
            [{contenido.orden}] [{contenido.tipo}] {contenido.titulo}
            {contenido.tipo === 'quiz' && (
              <>
                {' '}— <Link to={`/admin/contenidos/${contenido.id}/preguntas`}>Gestionar preguntas</Link>
              </>
            )}
            {' '}
            <Link to={`/admin/contenidos/${contenido.id}/editar`}>Editar</Link>
            {' '}
            <button onClick={() => handleEliminar(contenido.id)}>Eliminar</button>
          </li>
        ))}
      </ul>

      <h3>Agregar nuevo contenido</h3>
      <form onSubmit={handleAgregarContenido}>
        <div>
          <label>Título</label>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div>
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="video">Video</option>
            <option value="texto">Texto</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>

        {tipo === 'video' && (
          <div>
            <label>URL del video (embed)</label>
            <input type="text" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} />
          </div>
        )}

        {tipo === 'texto' && (
          <div>
            <label>Contenido</label>
            <textarea value={contenidoTexto} onChange={(e) => setContenidoTexto(e.target.value)} />
          </div>
        )}

        <button type="submit">Agregar contenido</button>
      </form>
    </div>
  );
}

export default AdminContenidos;
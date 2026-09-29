import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerContenidoRequest, editarContenidoRequest } from '../../services/contenidoService';

function ContenidoForm() {
  const { id } = useParams();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('video');
  const [urlVideo, setUrlVideo] = useState('');
  const [contenidoTexto, setContenidoTexto] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    cargarContenido();
  }, [id]);

  async function cargarContenido() {
    try {
      const contenido = await obtenerContenidoRequest(id);
      setTitulo(contenido.titulo);
      setTipo(contenido.tipo);
      setUrlVideo(contenido.urlVideo || '');
      setContenidoTexto(contenido.contenidoTexto || '');
    } catch (err) {
      setError('Error al cargar el contenido');
    } finally {
      setCargandoDatos(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await editarContenidoRequest(id, {
        titulo,
        tipo,
        urlVideo: tipo === 'video' ? urlVideo : undefined,
        contenidoTexto: tipo === 'texto' ? contenidoTexto : undefined,
      });
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al editar el contenido');
    }
  }

  if (cargandoDatos) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Editar contenido</h2>
      <form onSubmit={handleSubmit}>
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
            <label>URL del video</label>
            <input type="text" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} />
          </div>
        )}

        {tipo === 'texto' && (
          <div>
            <label>Contenido</label>
            <textarea value={contenidoTexto} onChange={(e) => setContenidoTexto(e.target.value)} />
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}

export default ContenidoForm;
import { useState, useEffect } from 'react';
import { obtenerPerfilRequest, editarPerfilRequest, subirFotoPerfilRequest } from '../services/usuarioService';
import { Link } from 'react-router-dom';

const ETIQUETAS_GENERO = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiero no decir',
};

function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estado del formulario de datos
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [genero, setGenero] = useState('');

  // Estado de la foto: solo se sube al confirmar "Guardar cambios"
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    try {
      const data = await obtenerPerfilRequest();
      setPerfil(data);
      setNombre(data.nombre);
      setApellido(data.apellido);
      setDescripcion(data.descripcion || '');
      setGenero(data.genero || '');
    } catch (err) {
      setError('Error al cargar el perfil');
    } finally {
      setCargando(false);
    }
  }

  function handleSeleccionarArchivo(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setArchivoSeleccionado(archivo);
    setPreviewFoto(URL.createObjectURL(archivo)); // solo para mostrar una vista previa local
  }

  function handleEntrarModoEdicion() {
    setModoEdicion(true);
    setMensaje('');
    setError('');
  }

  function handleCancelarEdicion() {
    // Restauramos todo a los valores originales, sin haber tocado el backend
    setNombre(perfil.nombre);
    setApellido(perfil.apellido);
    setDescripcion(perfil.descripcion || '');
    setGenero(perfil.genero || '');
    setArchivoSeleccionado(null);
    setPreviewFoto(null);
    setModoEdicion(false);
    setError('');
  }

  async function handleGuardarCambios(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);

    try {
      // Si eligió una foto nueva, la subimos primero
      if (archivoSeleccionado) {
        await subirFotoPerfilRequest(archivoSeleccionado);
      }

      // Guardamos los datos de texto
      const actualizado = await editarPerfilRequest({ nombre, apellido, descripcion, genero });

      setPerfil(actualizado);
      setArchivoSeleccionado(null);
      setPreviewFoto(null);
      setMensaje('Perfil actualizado correctamente');
      setModoEdicion(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p>Cargando perfil...</p>;

  const fotoAMostrar = previewFoto || perfil.fotoPerfil;

  return (
    <div>
      <h2>Mi perfil</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

      {/* Foto de perfil */}
      <div>
        {fotoAMostrar ? (
          <img
            src={fotoAMostrar}
            alt="Foto de perfil"
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            {perfil.nombre[0]}
          </div>
        )}

        {modoEdicion && (
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleSeleccionarArchivo}
            />
            {previewFoto && <p><em>Vista previa — se guardará al confirmar los cambios</em></p>}
          </div>
        )}
      </div>

      {/* Vista de solo lectura */}
      {!modoEdicion && (
        <div>
          <p><strong>Nombre:</strong> {perfil.nombre} {perfil.apellido}</p>
          <p><strong>Email:</strong> {perfil.email}</p>
          <p><strong>Descripción:</strong> {perfil.descripcion || 'Sin descripción'}</p>
          <p><strong>Género:</strong> {perfil.genero ? ETIQUETAS_GENERO[perfil.genero] : 'No especificado'}</p>

          <p>
            <Link to="/mis-cursos">Mis cursos</Link>
            {' | '}
            <Link to="/carrito">Carrito</Link>
            {' | '}
            <Link to="/favoritos">Favoritos</Link>
        </p>

          <button onClick={handleEntrarModoEdicion}>Editar perfil</button>
        </div>
      )}

      {/* Vista de edición */}
      {modoEdicion && (
        <form onSubmit={handleGuardarCambios}>
          <div>
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div>
            <label>Apellido</label>
            <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
          </div>
          <div>
            <label>Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div>
            <label>Género</label>
            <select value={genero} onChange={(e) => setGenero(e.target.value)}>
              <option value="">Preferir no especificar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </select>
          </div>

          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button type="button" onClick={handleCancelarEdicion} disabled={guardando}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}

export default Perfil;
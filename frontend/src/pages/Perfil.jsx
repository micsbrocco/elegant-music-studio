import { useState, useEffect } from 'react';
import { obtenerPerfilRequest, editarPerfilRequest, subirFotoPerfilRequest } from '../services/usuarioService';
import { useAuth } from '../context/AuthContext';
import Configuracion from './Configuracion';

const ETIQUETAS_GENERO = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiero no decir',
};

function Perfil() {
  const { actualizarUsuario } = useAuth();
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
      // Se actualiza también la sesión, para que la miniatura de la navbar muestre la foto nueva.
      actualizarUsuario({ nombre: actualizado.nombre, apellido: actualizado.apellido, fotoPerfil: actualizado.fotoPerfil || null });
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

  if (cargando) return <p className="text-muted">Cargando...</p>;

  const fotoAMostrar = previewFoto || perfil.fotoPerfil;

  return (
    <div className="cuenta-seccion">
      <div className="cuenta-seccion-cab">
        <h2 className="cuenta-seccion-titulo cuenta-titulo-con-accion">
          Mi cuenta
          {!modoEdicion && (
            <button
              type="button"
              className="cuenta-icono-btn"
              onClick={handleEntrarModoEdicion}
              aria-label="Editar perfil"
              title="Editar perfil"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}
        </h2>
        <p className="cuenta-seccion-sub">Tus datos personales y tu contraseña.</p>
      </div>

      {error && <div className="error-box">{error}</div>}
      {mensaje && <div className="success-box">{mensaje}</div>}

      {/* Vista de solo lectura */}
      {!modoEdicion && (
        <>
          <div className="perfil-datos">
            <div className="perfil-dato">
              <span className="perfil-dato-label">Nombre</span>
              <span className="perfil-dato-valor">{perfil.nombre} {perfil.apellido}</span>
            </div>
            <div className="perfil-dato">
              <span className="perfil-dato-label">Correo electrónico</span>
              <span className="perfil-dato-valor">{perfil.email}</span>
            </div>
            <div className="perfil-dato">
              <span className="perfil-dato-label">Descripción</span>
              <span className="perfil-dato-valor">{perfil.descripcion || 'Sin descripción'}</span>
            </div>
            <div className="perfil-dato">
              <span className="perfil-dato-label">Género</span>
              <span className="perfil-dato-valor">
                {perfil.genero ? ETIQUETAS_GENERO[perfil.genero] : 'No especificado'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Vista de edición */}
      {modoEdicion && (
        <form onSubmit={handleGuardarCambios} className="perfil-form">
          <div className="perfil-foto-edicion">
            {fotoAMostrar ? (
              <img src={fotoAMostrar} referrerPolicy="no-referrer" alt="Foto de perfil" className="perfil-avatar" />
            ) : (
              <div className="perfil-avatar perfil-avatar-inicial">{perfil.nombre[0]}</div>
            )}
            <div>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSeleccionarArchivo}
                  hidden
                />
                Cambiar foto
              </label>
              {previewFoto && (
                <p className="perfil-preview-nota" style={{ margin: '8px 0 0' }}>
                  <em>Vista previa: se guardará al confirmar los cambios</em>
                </p>
              )}
            </div>
          </div>

          <div className="field">
            <label className="label">Nombre</label>
            <input
              className="input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Apellido</label>
            <input
              className="input"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Género</label>
            <select className="input" value={genero} onChange={(e) => setGenero(e.target.value)}>
              <option value="">Preferir no especificar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </select>
          </div>

          <div className="perfil-form-acciones">
            <button type="submit" className="btn btn-success" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleCancelarEdicion} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* La contraseña (antes en "Configuración") vive ahora en la misma página */}
      {!modoEdicion && <Configuracion embebido />}
    </div>
  );
}

export default Perfil;

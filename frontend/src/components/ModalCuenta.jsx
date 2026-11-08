import { useState, useEffect, useRef, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ModalPagina from './ModalPagina';
import { useAuth } from '../context/AuthContext';
import {
  obtenerPerfilRequest,
  editarPerfilRequest,
  subirFotoPerfilRequest,
  cambiarPasswordRequest,
} from '../services/usuarioService';

const ETIQUETA_ROL = { admin: 'Administrador', profesor: 'Instructor' };
const MAX_BIO = 400;

// "Mi cuenta": arriba la identidad (la foto se cambia tocándola) y abajo un
// acordeón donde solo una sección está abierta a la vez. Al abrir una sección
// se ven los datos; para modificarlos se toca el lápiz. Al cerrar una sección
// sin guardar, se descartan los cambios.
function ModalCuenta() {
  const { usuario, actualizarUsuario, logout } = useAuth();
  const navigate = useNavigate();
  const esInstructor = usuario?.rol === 'admin' || usuario?.rol === 'profesor';

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [abierta, setAbierta] = useState(null); // 'datos' | 'bio' | 'password' | null
  const [recienGuardada, setRecienGuardada] = useState(null);

  useEffect(() => {
    obtenerPerfilRequest()
      .then(setPerfil)
      .catch(() => setErrorCarga('No se pudo cargar tu cuenta'))
      .finally(() => setCargando(false));
  }, []);

  // El "Guardado" verde del resumen desaparece solo
  useEffect(() => {
    if (!recienGuardada) return;
    const t = setTimeout(() => setRecienGuardada(null), 2500);
    return () => clearTimeout(t);
  }, [recienGuardada]);

  function alternar(seccion) {
    setAbierta((actual) => (actual === seccion ? null : seccion));
  }

  // Cada sección avisa cuando guardó: se actualiza el perfil y aparece "Guardado".
  // La sección queda abierta, de nuevo en modo lectura.
  function alGuardar(seccion, actualizado) {
    if (actualizado) {
      setPerfil(actualizado);
      actualizarUsuario({
        nombre: actualizado.nombre,
        apellido: actualizado.apellido,
        fotoPerfil: actualizado.fotoPerfil || null,
      });
    }
    setRecienGuardada(seccion);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <ModalPagina titulo="Mi cuenta" ancho={520}>
      {cargando ? (
        <p className="modal-texto-suave">Cargando...</p>
      ) : !perfil ? (
        <div className="error-box">{errorCarga}</div>
      ) : (
        <>
          <Identidad perfil={perfil} rol={usuario?.rol} onFotoSubida={(p) => alGuardar(null, p)} />

          <div className="acordeon">
            <SeccionAcordeon
              id="datos"
              titulo="Datos personales"
              resumen={`${perfil.nombre} ${perfil.apellido}`}
              icono={<IconoPersona />}
              abierta={abierta === 'datos'}
              guardada={recienGuardada === 'datos'}
              onAlternar={alternar}
            >
              <SeccionDatos perfil={perfil} onGuardado={(p) => alGuardar('datos', p)} />
            </SeccionAcordeon>

            {esInstructor && (
              <SeccionAcordeon
                id="bio"
                titulo="Biografía"
                resumen={perfil.descripcion ? perfil.descripcion : 'Todavía no escribiste tu biografía'}
                icono={<IconoTexto />}
                abierta={abierta === 'bio'}
                guardada={recienGuardada === 'bio'}
                onAlternar={alternar}
              >
                <SeccionBio perfil={perfil} onGuardado={(p) => alGuardar('bio', p)} />
              </SeccionAcordeon>
            )}

            <SeccionAcordeon
              id="password"
              titulo="Contraseña"
              resumen="••••••••"
              icono={<IconoCandado />}
              abierta={abierta === 'password'}
              guardada={recienGuardada === 'password'}
              onAlternar={alternar}
            >
              <SeccionPassword onGuardado={() => alGuardar('password')} />
            </SeccionAcordeon>
          </div>

          <button type="button" className="cuenta-cerrar-sesion" onClick={handleLogout}>
            <IconoSalir />
            Cerrar sesión
          </button>
        </>
      )}
    </ModalPagina>
  );
}

/* ---------- Cabecera: foto, nombre, email y rol ---------- */
function Identidad({ perfil, rol, onFotoSubida }) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  // La foto se sube apenas se elige: no hace falta un "Guardar" aparte.
  async function handleElegir(e) {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    setError('');
    setPreview(URL.createObjectURL(archivo));
    setSubiendo(true);
    try {
      const actualizado = await subirFotoPerfilRequest(archivo);
      onFotoSubida(actualizado);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo subir la foto');
    } finally {
      setPreview(null);
      setSubiendo(false);
    }
  }

  const foto = preview || perfil.fotoPerfil;

  return (
    <div className="cuenta-identidad">
      <button
        type="button"
        className="cuenta-avatar-btn"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        aria-label="Cambiar foto de perfil"
        title="Cambiar foto"
      >
        {foto ? (
          <img src={foto} referrerPolicy="no-referrer" alt="" className="cuenta-avatar" />
        ) : (
          <span className="cuenta-avatar cuenta-avatar-inicial">{perfil.nombre?.[0]}</span>
        )}
        <span className={`cuenta-avatar-capa ${subiendo ? 'activa' : ''}`}>
          {subiendo ? 'Subiendo…' : <IconoCamara />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleElegir} hidden />

      <div className="cuenta-identidad-texto">
        <p className="cuenta-identidad-nombre">{perfil.nombre} {perfil.apellido}</p>
        <p className="cuenta-identidad-email">{perfil.email}</p>
        {ETIQUETA_ROL[rol] && <span className="cuenta-rol">{ETIQUETA_ROL[rol]}</span>}
        {error && <p className="cuenta-error-chico">{error}</p>}
      </div>
    </div>
  );
}

/* ---------- Sección del acordeón ---------- */
function SeccionAcordeon({ id, titulo, resumen, icono, abierta, guardada, onAlternar, children }) {
  const idCuerpo = useId();
  // Cada vez que se abre, el formulario se vuelve a montar (key nueva): así arranca
  // con los datos guardados y lo que no se guardó la vez anterior se descarta.
  // Al cerrar se deja montado para que la animación de cierre se vea completa.
  const [vez, setVez] = useState(0);
  useEffect(() => {
    if (abierta) setVez((v) => v + 1);
  }, [abierta]);

  return (
    <div className={`acordeon-item ${abierta ? 'abierto' : ''}`}>
      <button
        type="button"
        className="acordeon-cab"
        onClick={() => onAlternar(id)}
        aria-expanded={abierta}
        aria-controls={idCuerpo}
      >
        <span className="acordeon-icono">{icono}</span>
        <span className="acordeon-textos">
          <span className="acordeon-titulo">{titulo}</span>
          {guardada ? (
            <span className="acordeon-resumen acordeon-resumen--ok">✓ Guardado</span>
          ) : (
            !abierta && <span className="acordeon-resumen">{resumen}</span>
          )}
        </span>
        <svg className="acordeon-flecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {/* El contenido se anima con grid-template-rows; "inert" evita que se pueda
          enfocar con Tab mientras está cerrado. */}
      <div id={idCuerpo} className="acordeon-cuerpo" inert={!abierta}>
        <div className="acordeon-cuerpo-interno">
          <div className="acordeon-contenido" key={vez}>{vez > 0 && children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Secciones: modo lectura con lápiz, y formulario al editar ---------- */
function VistaLectura({ filas, onEditar, textoEditar = 'Editar' }) {
  return (
    <div className="acordeon-vista">
      <dl className="acordeon-datos">
        {filas.map(({ etiqueta, valor, vacio }) => (
          <div key={etiqueta} className="acordeon-dato">
            <dt>{etiqueta}</dt>
            <dd className={vacio ? 'acordeon-dato-vacio' : ''}>{valor}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="acordeon-lapiz" onClick={onEditar} aria-label={textoEditar} title={textoEditar}>
        <IconoLapiz />
      </button>
    </div>
  );
}

function SeccionDatos({ perfil, onGuardado }) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    return (
      <FormDatos
        perfil={perfil}
        onCancelar={() => setEditando(false)}
        onGuardado={(p) => { setEditando(false); onGuardado(p); }}
      />
    );
  }
  return (
    <VistaLectura
      textoEditar="Editar datos personales"
      onEditar={() => setEditando(true)}
      filas={[
        { etiqueta: 'Nombre', valor: perfil.nombre },
        { etiqueta: 'Apellido', valor: perfil.apellido },
        { etiqueta: 'Email', valor: perfil.email },
      ]}
    />
  );
}

function SeccionBio({ perfil, onGuardado }) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    return (
      <FormBio
        perfil={perfil}
        onCancelar={() => setEditando(false)}
        onGuardado={(p) => { setEditando(false); onGuardado(p); }}
      />
    );
  }
  return (
    <VistaLectura
      textoEditar="Editar biografía"
      onEditar={() => setEditando(true)}
      filas={[{
        etiqueta: 'Sobre vos',
        valor: perfil.descripcion || 'Todavía no escribiste tu biografía. Se muestra en los cursos donde sos instructor.',
        vacio: !perfil.descripcion,
      }]}
    />
  );
}

function SeccionPassword({ onGuardado }) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    return (
      <FormPassword
        onCancelar={() => setEditando(false)}
        onGuardado={() => { setEditando(false); onGuardado(); }}
      />
    );
  }
  return (
    <VistaLectura
      textoEditar="Cambiar contraseña"
      onEditar={() => setEditando(true)}
      filas={[{ etiqueta: 'Contraseña', valor: 'Por seguridad no se muestra. Tocá el lápiz para cambiarla.', vacio: true }]}
    />
  );
}

/* ---------- Formularios de cada sección ---------- */
function FormDatos({ perfil, onCancelar, onGuardado }) {
  const [nombre, setNombre] = useState(perfil.nombre);
  const [apellido, setApellido] = useState(perfil.apellido);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const hayCambios = nombre.trim() !== perfil.nombre || apellido.trim() !== perfil.apellido;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const actualizado = await editarPerfilRequest({ nombre: nombre.trim(), apellido: apellido.trim() });
      onGuardado(actualizado);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron guardar los cambios');
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-fila-2">
        <div className="field">
          <label className="label" htmlFor="cuenta-nombre">Nombre</label>
          <input id="cuenta-nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label className="label" htmlFor="cuenta-apellido">Apellido</label>
          <input id="cuenta-apellido" className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
        </div>
      </div>
      <p className="modal-ayuda acordeon-nota">El email no se puede cambiar.</p>
      {error && <div className="error-box">{error}</div>}
      <AccionesForm guardando={guardando} deshabilitado={!hayCambios} onCancelar={onCancelar} />
    </form>
  );
}

function FormBio({ perfil, onCancelar, onGuardado }) {
  const [texto, setTexto] = useState(perfil.descripcion || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const actualizado = await editarPerfilRequest({ descripcion: texto.trim() });
      onGuardado(actualizado);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la biografía');
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="label" htmlFor="cuenta-bio">Sobre vos</label>
        <textarea
          id="cuenta-bio"
          className="input"
          rows={4}
          maxLength={MAX_BIO}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Productor y docente con 10 años de experiencia en estudio"
          autoFocus
        />
        <div className="acordeon-bio-pie">
          <span className="modal-ayuda">Se muestra en la página de los cursos donde sos instructor.</span>
          <span className="modal-ayuda">{texto.length}/{MAX_BIO}</span>
        </div>
      </div>
      {error && <div className="error-box">{error}</div>}
      <AccionesForm guardando={guardando} deshabilitado={texto.trim() === (perfil.descripcion || '')} onCancelar={onCancelar} />
    </form>
  );
}

function FormPassword({ onCancelar, onGuardado }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const noCoinciden = confirmacion.length > 0 && nueva !== confirmacion;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (nueva !== confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña');
      return;
    }
    setGuardando(true);
    try {
      await cambiarPasswordRequest(actual, nueva);
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña');
      setGuardando(false);
    }
  }

  const tipo = mostrar ? 'text' : 'password';

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="label" htmlFor="pw-actual">Contraseña actual</label>
        <input id="pw-actual" type={tipo} className="input" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" autoFocus required />
      </div>
      <div className="modal-fila-2">
        <div className="field">
          <label className="label" htmlFor="pw-nueva">Nueva</label>
          <input id="pw-nueva" type={tipo} className="input" placeholder="Mínimo 8, con letras y números" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="pw-confirmar">Repetir nueva</label>
          <input
            id="pw-confirmar"
            type={tipo}
            className={`input ${noCoinciden ? 'input-con-error' : ''}`}
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={noCoinciden}
          />
        </div>
      </div>
      <div className="acordeon-pw-extras">
        <label className="acordeon-check">
          <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} />
          Mostrar contraseñas
        </label>
        {noCoinciden && <span className="cuenta-error-chico">No coinciden</span>}
      </div>
      {error && <div className="error-box">{error}</div>}
      <AccionesForm guardando={guardando} textoGuardar="Actualizar contraseña" onCancelar={onCancelar} />
      <p className="modal-ayuda acordeon-nota">
        ¿Entraste con Google o no recordás la actual?{' '}
        <Link to="/recuperar-password" className="modal-link">Creá una nueva por email</Link>
      </p>
    </form>
  );
}

function AccionesForm({ guardando, deshabilitado = false, textoGuardar = 'Guardar', onCancelar }) {
  return (
    <div className="acordeon-acciones">
      <button type="button" className="modal-boton-texto" onClick={onCancelar} disabled={guardando}>
        Cancelar
      </button>
      <button type="submit" className="btn btn-success btn-sm" disabled={guardando || deshabilitado}>
        {guardando ? 'Guardando...' : textoGuardar}
      </button>
    </div>
  );
}

/* ---------- Íconos ---------- */
const PROPS_ICONO = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
function IconoPersona() {
  return <svg {...PROPS_ICONO}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function IconoTexto() {
  return <svg {...PROPS_ICONO}><path d="M4 6h16M4 12h16M4 18h10" /></svg>;
}
function IconoCandado() {
  return <svg {...PROPS_ICONO}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>;
}
function IconoCamara() {
  return <svg {...PROPS_ICONO} width={18} height={18}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>;
}
function IconoLapiz() {
  return <svg {...PROPS_ICONO} width={15} height={15}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
}
function IconoSalir() {
  return <svg {...PROPS_ICONO}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}

export default ModalCuenta;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cambiarPasswordRequest } from '../services/usuarioService';

// embebido: se muestra dentro de "Mi cuenta" (Perfil.jsx), sin título propio.
function Configuracion({ embebido = false }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [formAbierto, setFormAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  function cerrarFormulario() {
    setFormAbierto(false);
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmacion('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (nuevaPassword !== confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña');
      return;
    }

    setGuardando(true);
    try {
      await cambiarPasswordRequest(passwordActual, nuevaPassword);
      setMensaje('Contraseña actualizada correctamente');
      cerrarFormulario();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={embebido ? 'cuenta-seccion-embebida' : 'cuenta-seccion'}>
        {!embebido && (
          <div className="cuenta-seccion-cab">
            <h2 className="cuenta-seccion-titulo">Configuración</h2>
          </div>
        )}

        {mensaje && <div className="success-box">{mensaje}</div>}

        <div className="cuenta-card">
          <div className="cuenta-opcion">
            <div className="cuenta-opcion-texto">
              <h3 className="cuenta-card-titulo">Contraseña</h3>
            </div>
            {!formAbierto && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setFormAbierto(true); setMensaje(''); }}
              >
                Cambiar contraseña
              </button>
            )}
          </div>

          {formAbierto && (
            <form onSubmit={handleSubmit} className="cuenta-opcion-form">
              {error && <div className="error-box">{error}</div>}

              <div className="field">
                <label className="label" htmlFor="cfg-actual">Contraseña actual</label>
                <input
                  id="cfg-actual"
                  type="password"
                  className="input"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="cfg-nueva">Nueva contraseña</label>
                <input
                  id="cfg-nueva"
                  type="password"
                  className="input"
                  placeholder="Mínimo 8, con letras y números"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="cfg-confirmar">Repetir nueva contraseña</label>
                <input
                  id="cfg-confirmar"
                  type="password"
                  className="input"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="perfil-form-acciones">
                <button type="submit" className="btn btn-success" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar contraseña'}
                </button>
                <button type="button" className="btn btn-outline" onClick={cerrarFormulario} disabled={guardando}>
                  Cancelar
                </button>
              </div>

              <p className="cuenta-nota">
                ¿No recuerdas tu contraseña actual?{' '}
                <Link to="/recuperar-password" className="cuenta-link">Creá una nueva por email</Link>
              </p>
            </form>
          )}
        </div>
    </div>
  );
}

export default Configuracion;

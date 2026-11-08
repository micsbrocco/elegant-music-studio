import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetearPasswordRequest } from '../services/authService';
import logoElegant from '../assets/logo-elegant.png';

function ResetearPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // lee el ?token=... de la URL

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await resetearPasswordRequest(token, nuevaPassword);
      setMensaje('Contraseña actualizada. Ya podés iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000); // espera 2seg y redirige
    } catch (err) {
      setError(err.response?.data?.error || 'Error al resetear la contraseña');
    } finally {
      setCargando(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page-wrap">
        <div className="auth-card">
          <div className="auth-card-accent" />
          <div className="auth-card-body auth-card-body-centrado">
            <div className="auth-brand">
              <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
            </div>
            <h2 className="font-display auth-titulo">
              Link <em className="italic-gold">inválido</em>
            </h2>
            <p className="text-muted">
              Falta el token de recuperación. Pedí un nuevo link desde la pantalla de recuperación.
            </p>
            <p className="auth-footer-text">
              <Link to="/recuperar-password" className="auth-link">Pedir un nuevo link</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <div className="auth-card-accent" />

        <div className="auth-card-body">
          <div className="auth-brand">
            <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
          </div>

          <h2 className="font-display auth-titulo">
            Restablecer <em className="italic-gold">contraseña</em>
          </h2>
          <p className="text-muted auth-subtitulo">
            Elegí una nueva contraseña para tu cuenta.
          </p>

          {mensaje && <div className="success-box">{mensaje}</div>}
          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="reset-password">Nueva contraseña</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <input
                  id="reset-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  className="input input-with-icon input-with-toggle"
                  placeholder="Mínimo 8, con letras y números"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c5 0 9 4 10 8-.32 1.09-.86 2.2-1.6 3.2M6.6 6.6C4.6 8 3.2 10 2 12c1 4 5 8 10 8 1.5 0 2.9-.3 4.1-.9" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-success auth-submit" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
              <span className="hero-btn-arrow">→</span>
            </button>
          </form>

          <p className="auth-footer-text">
            <Link to="/login" className="auth-link">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetearPassword;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacionRequest } from '../services/authService';
import logoElegant from '../assets/logo-elegant.png';

function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);

    try {
      const data = await solicitarRecuperacionRequest(email);
      setMensaje(data.mensaje);
      // Esto es solo para el MVP, mientras el envío de email es simulado:
      if (data.linkSimulado) {
        console.log('Link de recuperación (simulado):', data.linkSimulado);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar recuperación');
    } finally {
      setCargando(false);
    }
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
            Recuperar <em className="italic-gold">contraseña</em>
          </h2>
          <p className="text-muted auth-subtitulo">
            Ingresá tu email y te mandamos un link para restablecerla.
          </p>

          {mensaje && <div className="success-box">{mensaje}</div>}
          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="recuperar-email">Correo electrónico</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 6l10 7 10-7" />
                </svg>
                <input
                  id="recuperar-email"
                  type="email"
                  className="input input-with-icon"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
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

export default RecuperarPassword;

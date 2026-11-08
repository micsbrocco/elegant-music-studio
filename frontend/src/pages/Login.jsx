import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginRequest } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import BotonGoogle from '../components/BotonGoogle';
import { rutaInicioSegunRol } from '../utils/rutas';
import logoElegant from '../assets/logo-elegant.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  // Si se llegó acá porque venció la sesión, se avisa (una sola vez)
  const [sesionVencida] = useState(() => {
    try {
      const vencida = sessionStorage.getItem('sesion-vencida') === '1';
      sessionStorage.removeItem('sesion-vencida');
      return vencida;
    } catch {
      return false;
    }
  });
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = location.state && location.state.backgroundLocation;

  function cerrar() {
    if (backgroundLocation) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  // Bloquea el scroll de fondo y permite cerrar con Escape mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function manejarTecla(e) {
      if (e.key === 'Escape') cerrar();
    }
    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', manejarTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const data = await loginRequest(email, password);
      login(data.usuario, data.token);
      navigate(rutaInicioSegunRol(data.usuario));
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al iniciar sesión';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className="auth-card">
        <button type="button" className="auth-close" onClick={cerrar} aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        <div className="auth-card-accent" />

        <div className="auth-card-body">
          <div className="auth-brand">
            <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
          </div>

          <div className="auth-tabs">
            <span className="auth-tab auth-tab-activo">Iniciar sesión</span>
            <Link to="/registro" state={{ backgroundLocation }} replace className="auth-tab">Crear cuenta</Link>
          </div>

          <h2 className="font-display auth-titulo">
            Iniciar <em className="italic-gold">sesión</em>
          </h2>
          <p className="text-muted auth-subtitulo">
            Ingresá tus credenciales para acceder a tu cuenta.
          </p>

          {sesionVencida && !error && <div className="error-box">Tu sesión venció. Volvé a iniciar sesión.</div>}
          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="login-email">Correo electrónico</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 6l10 7 10-7" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  className="input input-with-icon"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="login-password">Contraseña</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  className="input input-with-icon input-with-toggle"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <Link to="/recuperar-password" className="auth-link-sm auth-link-sm-debajo">¿Olvidaste tu clave?</Link>
            </div>

            {/* TODO: implementar persistencia real de "recordarme" (token de larga duración) */}
            <label className="auth-checkbox">
              <input type="checkbox" defaultChecked />
              <span>Recordarme</span>
            </label>

            <button type="submit" className="btn btn-primary auth-submit" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
              <span className="hero-btn-arrow">→</span>
            </button>
          </form>

          <div className="auth-divider">
            <span>O autenticate con</span>
          </div>

          <BotonGoogle onError={setError} />

          <p className="auth-footer-text">
            ¿No tenés cuenta? <Link to="/registro" state={{ backgroundLocation }} replace className="auth-link">Creá una cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { registrarRequest } from '../services/authService';
import BotonGoogle from '../components/BotonGoogle';
import logoElegant from '../assets/logo-elegant.png';

function Registro() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = location.state && location.state.backgroundLocation;
  // Si se llegó desde "Iniciar sesión", la ventana ya estaba abierta: solo se desliza el contenido
  const cambio = location.state && location.state.cambioAuth;

  function cerrar() {
    if (backgroundLocation) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

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
      await registrarRequest(nombre, apellido, email, password);
      setRegistroExitoso(true);
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al registrarse';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className={`auth-overlay ${cambio ? 'auth-sin-entrada' : ''}`}
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

        {registroExitoso ? (
          <div className="auth-card-body auth-card-body-centrado">
            <div className="auth-success-icon">✓</div>
            <h2 className="font-display auth-titulo">¡Cuenta <em className="italic-gold">creada</em>!</h2>
            <p className="text-muted">
              Te mandamos un email para confirmar tu cuenta. Revisá tu bandeja de entrada (y spam).
            </p>

            <Link to="/login" className="btn btn-primary auth-submit">
              Ir a iniciar sesión
              <span className="hero-btn-arrow">→</span>
            </Link>
          </div>
        ) : (
          <div className={`auth-card-body ${cambio ? 'auth-cambio-der' : ''}`}>
            <div className="auth-brand">
              <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
            </div>

            <div className={`auth-tabs auth-tabs--registro ${cambio ? 'auth-tabs--desliza' : ''}`}>
              <Link to="/login" state={{ backgroundLocation, cambioAuth: true }} replace className="auth-tab">Iniciar sesión</Link>
              <span className="auth-tab auth-tab-activo">Crear cuenta</span>
            </div>

            <h2 className="font-display auth-titulo">
              Creá tu <em className="italic-gold">cuenta</em>
            </h2>
            <p className="text-muted auth-subtitulo">
              Sumate a la academia y empezá a aprender producción musical.
            </p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="auth-field-row">
                <div className="field">
                  <label className="label" htmlFor="reg-nombre">Nombre</label>
                  <input
                    id="reg-nombre"
                    type="text"
                    className="input"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="reg-apellido">Apellido</label>
                  <input
                    id="reg-apellido"
                    type="text"
                    className="input"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="reg-email">Correo electrónico</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 6l10 7 10-7" />
                  </svg>
                  <input
                    id="reg-email"
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
                <label className="label" htmlFor="reg-password">Contraseña</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="11" width="16" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                  <input
                    id="reg-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    className="input input-with-icon input-with-toggle"
                    placeholder="Mínimo 8, con letras y números"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <button type="submit" className="btn btn-primary auth-submit" disabled={cargando}>
                {cargando ? 'Creando cuenta...' : 'Registrarme'}
                <span className="hero-btn-arrow">→</span>
              </button>
            </form>

            <div className="auth-divider">
              <span>O autenticate con</span>
            </div>

            <BotonGoogle onError={setError} />

            <p className="auth-footer-text">
              ¿Ya tenés cuenta? <Link to="/login" state={{ backgroundLocation, cambioAuth: true }} replace className="auth-link">Iniciá sesión</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Registro;
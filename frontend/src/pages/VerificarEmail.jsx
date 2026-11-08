import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verificarEmailRequest } from '../services/authService';
import logoElegant from '../assets/logo-elegant.png';

function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'exito' | 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('error');
      setError('Falta el token de verificación.');
      return;
    }

    verificarEmailRequest(token)
      .then(() => setEstado('exito'))
      .catch((err) => {
        setEstado('error');
        setError(err.response?.data?.error || 'Error al verificar el email');
      });
  }, [token]);

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <div className="auth-card-accent" />
        <div className="auth-card-body auth-card-body-centrado">
          <div className="auth-brand">
            <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
          </div>

          {estado === 'cargando' && (
            <>
              <h2 className="font-display auth-titulo">Verificando tu cuenta...</h2>
              <p className="text-muted">Un momento, por favor.</p>
            </>
          )}

          {estado === 'exito' && (
            <>
              <h2 className="font-display auth-titulo">
                ¡Cuenta <em className="italic-gold">confirmada</em>!
              </h2>
              <p className="text-muted">Ya podés iniciar sesión con tu email y contraseña.</p>
              <Link to="/login" className="btn btn-primary auth-submit">
                Ir a iniciar sesión
                <span className="hero-btn-arrow">→</span>
              </Link>
            </>
          )}

          {estado === 'error' && (
            <>
              <h2 className="font-display auth-titulo">
                Link <em className="italic-gold">inválido</em>
              </h2>
              <p className="text-muted">{error}</p>
              <p className="auth-footer-text">
                <Link to="/login" className="auth-link">Volver a iniciar sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificarEmail;

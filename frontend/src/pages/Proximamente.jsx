import { Link } from 'react-router-dom';
import logoElegant from '../assets/logo-elegant.png';

// Se muestra en lugar del catálogo, los cursos, el carrito y el registro
// mientras el sitio está en modo "Próximamente".
function Proximamente() {
  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <div className="auth-card-accent" />
        <div className="auth-card-body auth-card-body-centrado">
          <div className="auth-brand">
            <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
          </div>
          <h2 className="font-display auth-titulo">Próximamente</h2>
          <p className="text-muted">Estamos preparando los cursos.</p>
          <Link to="/" className="btn btn-primary auth-submit" style={{ textDecoration: 'none' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Proximamente;

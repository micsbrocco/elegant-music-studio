import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Footer() {
  const anio = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }
  const esPortalDeCursos = location.pathname.startsWith('/cursos');

  const redesSociales = (
    <div className="footer-social">
      <a href="https://www.instagram.com/elegantmusicstudio?utm_source=ig_web_button_share_sheet&vrfl=ZDNlZDc0MzIxNw==" className="social-icon" aria-label="Instagram" target="_blank" rel="noreferrer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <a href="https://www.youtube.com/@EMSLoungeMusic" className="social-icon" aria-label="YouTube" target="_blank" rel="noreferrer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <a href="https://open.spotify.com/intl-es/artist/5ECZMVNutJOaD06l456aEt?si=U5ygcvWSQcCNFL-tECtskQ" className="social-icon" aria-label="Spotify" target="_blank" rel="noreferrer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.59 14.4a.62.62 0 01-.85.21c-2.33-1.42-5.26-1.75-8.72-.96a.62.62 0 11-.27-1.2c3.79-.87 7.03-.49 9.63 1.1.3.18.39.57.21.85zm1.22-2.72a.78.78 0 01-1.07.26c-2.67-1.64-6.73-2.12-9.88-1.16a.78.78 0 01-.45-1.49c3.6-1.09 8.07-.56 11.13 1.32.37.23.49.72.27 1.07zm.1-2.83C14.6 9.02 9.44 8.84 6.4 9.79a.93.93 0 11-.55-1.78c3.5-1.09 9.24-.87 12.89 1.32a.93.93 0 11-.96 1.6z" />
        </svg>
      </a>
    </div>
  );

  if (esPortalDeCursos) {
    // Versión reducida del footer para el portal de cursos: una franja baja con
    // la marca, el contacto en línea y las redes; abajo, el copyright.
    return (
      <footer className="footer footer-compacto">
        <div className="container footer-inner">
          <div className="footer-compacto-top">
            <div className="footer-compacto-marca">
              <span className="font-display footer-logo">Elegant Music Studio</span>
              <em className="italic-gold footer-tagline">Donde el sonido toma forma.</em>
            </div>

            {/* A la derecha: el mail y los íconos (redes + WhatsApp) */}
            <div className="footer-compacto-contacto">
              <a href="mailto:elegantmusicstudiotuc@gmail.com" className="footer-link">
                elegantmusicstudiotuc@gmail.com
              </a>
              <div className="footer-social">
                {redesSociales.props.children}
                <a href="https://wa.me/5493813397678" className="social-icon" aria-label="WhatsApp" target="_blank" rel="noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 01-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.41 9.41 0 012.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0012.04.63C5.76.63.65 5.74.65 12.02c0 2.01.52 3.97 1.52 5.7L.55 23.62l6.03-1.58a11.37 11.37 0 005.45 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">© {anio} Elegant Music Studio · Tucumán, Argentina. Todos los derechos reservados.</p>
            <div className="footer-legal">
              <Link to="/arrepentimiento" className="footer-link footer-link-sm footer-link-arrepentimiento">Botón de arrepentimiento</Link>
              {/* TODO: crear estas páginas si hacen falta */}
              <a href="#" className="footer-link footer-link-sm">Términos</a>
              <a href="#" className="footer-link footer-link-sm">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="hero-glow hero-glow-1" />

      <div className="container footer-inner">
        <div className="footer-top">
          {/* Marca */}
          <div className="footer-brand">
            <h3 className="font-display footer-logo">Elegant Music Studio</h3>
            <p className="footer-tagline">
              <em className="italic-gold">Donde el sonido toma forma.</em>
            </p>

            {redesSociales}
          </div>

          {/* Navegación */}
          <div className="footer-col">
            <p className="footer-col-titulo">Navegación</p>
            <Link to="/" className="footer-link">Inicio</Link>
            <Link to="/cursos" className="footer-link">Cursos</Link>
            <Link to="/#producciones" className="footer-link">Producciones</Link>
            <Link to="/#nosotros" className="footer-link">Nuestro equipo</Link>
          </div>

          {/* Cuenta */}
          <div className="footer-col">
            <p className="footer-col-titulo">Cuenta</p>
            {/* Con la sesión iniciada no tiene sentido ofrecer ingresar o registrarse */}
            {usuario ? (
              <>
                <Link to="/mis-cursos" className="footer-link">Mis cursos</Link>
                <Link to="/perfil" state={{ backgroundLocation: location }} className="footer-link">Mi cuenta</Link>
                <button type="button" onClick={handleLogout} className="footer-link footer-link-boton">Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link to="/login" state={{ backgroundLocation: location }} className="footer-link">Iniciar sesión</Link>
                <Link to="/registro" state={{ backgroundLocation: location }} className="footer-link">Crear cuenta</Link>
              </>
            )}
          </div>

          {/* Contacto */}
          <div className="footer-col">
            <p className="footer-col-titulo">Contacto</p>
            {/* TODO: reemplazar por los datos reales */}
            <a href="mailto:elegantmusicstudiotuc@gmail.com" className="footer-link">
              elegantmusicstudiotuc@gmail.com
            </a>
            <a href="https://wa.me/5493813397678" className="footer-link" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <p className="footer-link footer-link-static">Tucumán, Argentina</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {anio} Elegant Music Studio. Todos los derechos reservados.</p>
          <div className="footer-legal">
            <Link to="/arrepentimiento" className="footer-link footer-link-sm footer-link-arrepentimiento">Botón de arrepentimiento</Link>
            {/* TODO: crear estas páginas si hacen falta */}
            <a href="#" className="footer-link footer-link-sm">Términos</a>
            <a href="#" className="footer-link footer-link-sm">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

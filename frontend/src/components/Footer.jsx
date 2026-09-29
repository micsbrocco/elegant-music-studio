import { Link } from 'react-router-dom';

function Footer() {
  const anio = new Date().getFullYear();

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

            <div className="footer-social">
              {/* TODO: reemplazar por las redes reales */}
              <a href="#" className="social-icon" aria-label="Instagram" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="YouTube" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="Spotify" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.59 14.4a.62.62 0 01-.85.21c-2.33-1.42-5.26-1.75-8.72-.96a.62.62 0 11-.27-1.2c3.79-.87 7.03-.49 9.63 1.1.3.18.39.57.21.85zm1.22-2.72a.78.78 0 01-1.07.26c-2.67-1.64-6.73-2.12-9.88-1.16a.78.78 0 01-.45-1.49c3.6-1.09 8.07-.56 11.13 1.32.37.23.49.72.27 1.07zm.1-2.83C14.6 9.02 9.44 8.84 6.4 9.79a.93.93 0 11-.55-1.78c3.5-1.09 9.24-.87 12.89 1.32a.93.93 0 11-.96 1.6z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div className="footer-col">
            <p className="footer-col-titulo">Navegación</p>
            <Link to="/" className="footer-link">Inicio</Link>
            <Link to="/cursos" className="footer-link">Cursos</Link>
            <a href="/#producciones" className="footer-link">Producciones</a>
            <a href="/#nosotros" className="footer-link">Nuestro equipo</a>
          </div>

          {/* Cuenta */}
          <div className="footer-col">
            <p className="footer-col-titulo">Cuenta</p>
            <Link to="/login" className="footer-link">Iniciar sesión</Link>
            <Link to="/registro" className="footer-link">Crear cuenta</Link>
          </div>

          {/* Contacto */}
          <div className="footer-col">
            <p className="footer-col-titulo">Contacto</p>
            {/* TODO: reemplazar por los datos reales */}
            <a href="mailto:contacto@elegantmusicstudio.com" className="footer-link">
              contacto@elegantmusicstudio.com
            </a>
            <a href="https://wa.me/5490000000000" className="footer-link" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <p className="footer-link footer-link-static">Tucumán, Argentina</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {anio} Elegant Music Studio. Todos los derechos reservados.</p>
          <div className="footer-legal">
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
import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoElegant from '../assets/logo-elegant.png';

function IconoCarrito() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function IconoPerfil() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconoFavoritos() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconoSalir() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  // Cierra el dropdown si se hace clic afuera de él
  useEffect(() => {
    function manejarClickAfuera(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', manejarClickAfuera);
    return () => document.removeEventListener('mousedown', manejarClickAfuera);
  }, []);

  function handleLogout() {
    logout();
    setMenuMobileAbierto(false);
    setDropdownAbierto(false);
    navigate('/login');
  }

  function cerrarMenus() {
    setMenuMobileAbierto(false);
    setDropdownAbierto(false);
  }

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: isActive ? 'var(--color-gold)' : 'var(--color-warm-white)',
    opacity: isActive ? 1 : 0.85,
    transition: 'color 0.2s, opacity 0.2s',
  });

  const anchorLinkStyle = {
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--color-warm-white)',
    opacity: 0.85,
  };

  return (
    <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 50, background: 'var(--color-ink)' }}>
      <div className="container navbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" onClick={cerrarMenus} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={logoElegant} alt="Elegant Music Studio" style={{ height: 68, width: 'auto' }} />
        </Link>

        {/* Desktop */}
        <div className="nav-links-desktop">
          <NavLink to="/" end style={navLinkStyle}>Inicio</NavLink>
          <NavLink to="/cursos" style={navLinkStyle}>Cursos</NavLink>
          <a href="/#producciones" style={anchorLinkStyle}>Nuestras producciones</a>

          {usuario && (
            <NavLink to="/mis-cursos" style={navLinkStyle}>Portal estudiante</NavLink>
          )}

          <Link to="/carrito" style={{ ...anchorLinkStyle, display: 'flex', opacity: 0.9 }} aria-label="Carrito">
            <IconoCarrito />
          </Link>

          {usuario?.rol === 'admin' && (
            <NavLink to="/admin" style={navLinkStyle}>Panel Admin</NavLink>
          )}

          {usuario ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownAbierto(!dropdownAbierto)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,162,39,0.15)', border: '1.5px solid var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-gold)' }}>
                    {usuario.nombre[0]}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-warm-white)' }}>{usuario.nombre}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownAbierto && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)', background: '#fff',
                    border: '1px solid var(--color-warm-gray)', borderRadius: 10, minWidth: 190,
                    boxShadow: '0 12px 32px rgba(26,21,16,0.25)', overflow: 'hidden', zIndex: 60,
                  }}
                >
                  <Link to="/perfil" onClick={cerrarMenus} className="dropdown-item">
                    <IconoPerfil /> Mi perfil
                  </Link>
                  <Link to="/favoritos" onClick={cerrarMenus} className="dropdown-item">
                    <IconoFavoritos /> Favoritos
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                    <IconoSalir /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={anchorLinkStyle}>Ingresar</Link>
              <Link to="/registro" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Registrarme</Link>
            </>
          )}
        </div>

        {/* Botón hamburguesa mobile */}
        <button className="nav-mobile-toggle" onClick={() => setMenuMobileAbierto(!menuMobileAbierto)} aria-label="Abrir menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#faf8f4" strokeWidth="2" strokeLinecap="round">
            {menuMobileAbierto ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {/* Menú mobile (todo plano, sin dropdown anidado) */}
      <div className={`nav-mobile-menu ${menuMobileAbierto ? 'open' : ''}`}>
        <Link to="/" onClick={cerrarMenus}>Inicio</Link>
        <Link to="/cursos" onClick={cerrarMenus}>Cursos</Link>
        <a href="/#producciones" onClick={cerrarMenus}>Nuestras producciones</a>
        <Link to="/carrito" onClick={cerrarMenus}>🛒 Carrito</Link>
        {usuario ? (
          <>
            <Link to="/mis-cursos" onClick={cerrarMenus}>Portal estudiante</Link>
            <Link to="/favoritos" onClick={cerrarMenus}>Favoritos</Link>
            <Link to="/perfil" onClick={cerrarMenus}>Mi perfil ({usuario.nombre})</Link>
            {usuario.rol === 'admin' && <Link to="/admin" onClick={cerrarMenus}>Panel Admin</Link>}
            <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={cerrarMenus}>Ingresar</Link>
            <Link to="/registro" onClick={cerrarMenus}>Registrarme</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
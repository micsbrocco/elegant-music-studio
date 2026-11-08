import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSitio } from '../context/SitioContext';
import { verCarritoRequest, quitarDelCarritoRequest } from '../services/carritoService';
import { obtenerCarritoInvitado, quitarDelCarritoInvitado, alCambiarCarritoInvitado } from '../services/carritoInvitado';
import { obtenerCursoRequest } from '../services/cursoService';
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


function IconoCompras() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
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

function IconoQuitar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function Navbar() {
  const { usuario, logout } = useAuth();
  // En "Próximamente" no hay carrito ni registro
  const { cursosCerrados } = useSitio();
  const destinoCursos = '/#cursos-destacados';
  const navigate = useNavigate();
  const location = useLocation();

  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [carritoItems, setCarritoItems] = useState([]);
  const [carritoCargando, setCarritoCargando] = useState(false);
  const [errorCarrito, setErrorCarrito] = useState('');
  const carritoRef = useRef(null);

  // Dentro de una clase, la nav se reduce: no compite con el contenido ni
  // ofrece navegación que no tiene sentido ahí (catálogo, carrito, etc).
  // Si hay una ventana abierta (Mi cuenta, Mis compras, login), se mira la página de fondo.
  const fondo = (location.state && location.state.backgroundLocation) || location;
  const modoAprendizaje = /^\/cursos\/[^/]+\/aprender/.test(fondo.pathname);
  // En Mis cursos la navbar también va reducida (Inicio, Mis cursos y menú de usuario),
  // pero se mantiene el carrito porque desde "Explorar cursos" se pueden agregar cursos.
  // /perfil y /mis-compras abiertos directo por URL muestran Mis cursos de fondo.
  const enMisCursos = ['/mis-cursos', '/perfil', '/mis-compras'].includes(fondo.pathname);
  const navReducida = modoAprendizaje || enMisCursos;

  // Cierra los dropdowns si se hace clic afuera de ellos
  useEffect(() => {
    function manejarClickAfuera(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
      if (carritoRef.current && !carritoRef.current.contains(e.target)) {
        setCarritoAbierto(false);
      }
    }
    document.addEventListener('mousedown', manejarClickAfuera);
    return () => document.removeEventListener('mousedown', manejarClickAfuera);
  }, []);

  // Sin sesión, el carrito vive en este navegador (localStorage), no en la
  // base de datos: buscamos los datos de cada curso guardado ahí.
  async function obtenerCarritoDeInvitadoConDatos() {
    const ids = obtenerCarritoInvitado();
    const cursos = await Promise.all(
      ids.map((id) =>
        obtenerCursoRequest(id)
          .then((curso) => ({ id: curso.id, curso }))
          .catch(() => null)
      )
    );
    return cursos.filter(Boolean);
  }

  // Para que el ícono ya muestre la cantidad de cursos en el carrito sin
  // tener que abrirlo
  useEffect(() => {
    cargarCarrito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  // Si se agrega/quita algo del carrito de invitado desde otra parte de la
  // página (ej: el catálogo), el número del ícono se actualiza al toque.
  useEffect(() => {
    return alCambiarCarritoInvitado(() => {
      if (!usuario) cargarCarrito();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  async function cargarCarrito() {
    try {
      const data = usuario ? await verCarritoRequest() : await obtenerCarritoDeInvitadoConDatos();
      setCarritoItems(data);
    } catch (err) {
      // silencioso: si falla, simplemente no mostramos el contador
    }
  }

  function toggleCarrito() {
    const abrir = !carritoAbierto;
    setCarritoAbierto(abrir);
    setDropdownAbierto(false);
    if (abrir) {
      setErrorCarrito('');
      setCarritoCargando(true);
      const promesa = usuario ? verCarritoRequest() : obtenerCarritoDeInvitadoConDatos();
      promesa
        .then(setCarritoItems)
        .catch(() => setErrorCarrito('No se pudo cargar el carrito'))
        .finally(() => setCarritoCargando(false));
    }
  }

  async function handleQuitarDelCarrito(id) {
    if (!usuario) {
      quitarDelCarritoInvitado(id);
      setCarritoItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    try {
      await quitarDelCarritoRequest(id);
      setCarritoItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Error al quitar el curso del carrito');
    }
  }

  function handleLogout() {
    logout();
    setMenuMobileAbierto(false);
    setDropdownAbierto(false);
    navigate('/');
  }

  function cerrarMenus() {
    setMenuMobileAbierto(false);
    setDropdownAbierto(false);
    setCarritoAbierto(false);
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

  const totalCarrito = carritoItems.reduce((suma, item) => suma + Number(item.curso.precio), 0);

  const menuUsuario = usuario ? (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setDropdownAbierto(!dropdownAbierto); setCarritoAbierto(false); }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(201,162,39,0.15)', boxShadow: '0 0 0 2px var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {usuario.fotoPerfil ? (
            <img src={usuario.fotoPerfil} referrerPolicy="no-referrer" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-gold)' }}>
              {usuario.nombre[0]}
            </span>
          )}
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
          <Link to="/perfil" state={{ backgroundLocation: fondo }} onClick={cerrarMenus} className="dropdown-item">
            <IconoPerfil /> Mi cuenta
          </Link>
          <Link to="/mis-compras" state={{ backgroundLocation: fondo }} onClick={cerrarMenus} className="dropdown-item">
            <IconoCompras /> Mis compras
          </Link>
          <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
            <IconoSalir /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  ) : (
    <>
      <Link to="/login" state={{ backgroundLocation: location }} style={anchorLinkStyle}>Ingresar</Link>
      {!cursosCerrados && (
        <Link to="/registro" state={{ backgroundLocation: location }} className="btn btn-primary btn-sm" style={{ textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Registrarme</Link>
      )}
    </>
  );

  const menuCarrito = (
    <div ref={carritoRef} style={{ position: 'relative' }}>
      <button
        onClick={toggleCarrito}
        aria-label="Carrito"
        style={{ ...anchorLinkStyle, display: 'flex', opacity: 0.9, background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' }}
      >
        <IconoCarrito />
        {carritoItems.length > 0 && (
          <span
            style={{
              position: 'absolute', top: -8, right: -10, minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: 999, background: 'var(--color-gold)', color: 'var(--color-ink)',
              fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {carritoItems.length}
          </span>
        )}
      </button>

      {carritoAbierto && (
        <div
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 14px)', background: '#fff',
            border: '1px solid var(--color-warm-gray)', borderRadius: 14, width: 320,
            boxShadow: '0 12px 32px rgba(26,21,16,0.25)', overflow: 'hidden', zIndex: 60,
            padding: 18,
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 12px' }}>
            Mi carrito
          </p>

          {carritoCargando ? (
            <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Cargando...</p>
          ) : carritoItems.length === 0 ? (
            <>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 14 }}>Tu carrito está vacío.</p>
              <Link to="/cursos" onClick={cerrarMenus} className="btn btn-outline btn-sm" style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>
                Ver catálogo
              </Link>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto', marginBottom: 14 }}>
                {carritoItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', margin: 0, lineHeight: 1.3 }}>
                        {item.curso.titulo}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>
                        ${item.curso.precio}
                      </p>
                    </div>
                    <button
                      onClick={() => handleQuitarDelCarrito(item.id)}
                      aria-label="Quitar del carrito"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}
                    >
                      <IconoQuitar />
                    </button>
                  </div>
                ))}
              </div>

              {errorCarrito && <div className="error-box" style={{ marginBottom: 12 }}>{errorCarrito}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-warm-gray)', paddingTop: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)' }}>${totalCarrito}</span>
              </div>

              <Link
                to="/carrito"
                onClick={cerrarMenus}
                className="btn auth-submit navbar-ir-a-pagar"
                style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block' }}
              >
                Ir a pagar
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 50, background: 'var(--color-hero)' }}>
      <div className="container navbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" onClick={cerrarMenus} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={logoElegant} alt="Elegant Music Studio" style={{ height: 68, width: 'auto' }} />
        </Link>

        {/* Desktop */}
        <div className="nav-links-desktop">
          <NavLink to="/" end style={navLinkStyle}>Inicio</NavLink>

          {!navReducida && (
            <>
              <Link to={destinoCursos} style={anchorLinkStyle}>Cursos</Link>
              <Link to="/#producciones" style={anchorLinkStyle}>Nuestras producciones</Link>
              <Link to="/#nosotros" style={anchorLinkStyle}>Conócenos</Link>
            </>
          )}

          {!modoAprendizaje && !cursosCerrados && menuCarrito}

          {!navReducida && (
            <Link to="/#contacto" className="btn btn-outline-gold btn-sm" style={{ textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Contáctanos
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: 'auto' }}>
            <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, fontWeight: 300 }}>|</span>

            {usuario && (
              <NavLink to="/mis-cursos" style={navLinkStyle}>Mis cursos</NavLink>
            )}

            {!navReducida && usuario?.rol === 'admin' && (
              <NavLink to="/admin" style={navLinkStyle}>Panel Admin</NavLink>
            )}
            {!navReducida && usuario?.rol === 'profesor' && (
              <NavLink to="/panel-instructor" style={navLinkStyle}>Editar cursos</NavLink>
            )}

            {menuUsuario}
          </div>
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
        {/* Menú del celular: filas separadas por líneas, sin links subrayados */}
        <nav className="menu-movil-lista" aria-label="Menú">
          <FilaMenu to="/" onClick={cerrarMenus}>Inicio</FilaMenu>
          {!navReducida && <FilaMenu to={destinoCursos} onClick={cerrarMenus}>Cursos</FilaMenu>}
          {!navReducida && <FilaMenu to="/#producciones" onClick={cerrarMenus}>Nuestras producciones</FilaMenu>}
          {!navReducida && <FilaMenu to="/#nosotros" onClick={cerrarMenus}>Conócenos</FilaMenu>}
          {!navReducida && <FilaMenu to="/#contacto" onClick={cerrarMenus}>Contáctanos</FilaMenu>}
          {!modoAprendizaje && !cursosCerrados && (
            <FilaMenu to="/carrito" onClick={cerrarMenus} extra={carritoItems.length > 0 ? carritoItems.length : null}>Carrito</FilaMenu>
          )}
        </nav>
        {usuario ? (
          <>
            <p className="menu-movil-titulo">{usuario.nombre}</p>
            <nav className="menu-movil-lista" aria-label="Tu cuenta">
              <FilaMenu to="/mis-cursos" onClick={cerrarMenus}>Mis cursos</FilaMenu>
              <FilaMenu to="/perfil" state={{ backgroundLocation: fondo }} onClick={cerrarMenus}>Mi cuenta</FilaMenu>
              <FilaMenu to="/mis-compras" state={{ backgroundLocation: fondo }} onClick={cerrarMenus}>Mis compras</FilaMenu>
              {!navReducida && usuario.rol === 'admin' && <FilaMenu to="/admin" onClick={cerrarMenus}>Panel de administrador</FilaMenu>}
              {!navReducida && usuario.rol === 'profesor' && <FilaMenu to="/panel-instructor" onClick={cerrarMenus}>Editar cursos</FilaMenu>}
            </nav>
            <button type="button" onClick={handleLogout} className="menu-movil-salir">Cerrar sesión</button>
          </>
        ) : (
          <div className="menu-movil-acciones">
            <Link to="/login" state={{ backgroundLocation: location }} onClick={cerrarMenus} className="menu-movil-boton menu-movil-boton--dorado">Ingresar</Link>
            {!cursosCerrados && (
              <Link to="/registro" state={{ backgroundLocation: location }} onClick={cerrarMenus} className="menu-movil-boton">Registrarme</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

// Una fila del menú del celular: texto a la izquierda y flechita a la derecha
function FilaMenu({ children, extra, ...props }) {
  return (
    <Link className="menu-movil-fila" {...props}>
      <span>{children}</span>
      {extra != null && <span className="menu-movil-cantidad">{extra}</span>}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </Link>
  );
}

export default Navbar;

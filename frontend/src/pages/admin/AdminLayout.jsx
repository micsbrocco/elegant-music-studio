import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import CampanaNotificaciones from './CampanaNotificaciones';
import { contarConsultasPendientesRequest } from '../../services/consultaService';
import { useAuth } from '../../context/AuthContext';
import logoElegant from '../../assets/logo-elegant.png';

function IconoDashboard() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function IconoMetricas() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" />
    </svg>
  );
}
function IconoCatalogo() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}
function IconoModulos() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}
function IconoAlumnos() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconoPreguntas() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function IconoInstructores() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" /><path d="M6 12v5c3 1.6 9 1.6 12 0v-5" />
    </svg>
  );
}
function IconoLanding() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z" />
    </svg>
  );
}
function IconoBusqueda() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconoSalir() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconoVolver() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconoSol() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function IconoLuna() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function IconoMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

// modoInstructor: mismo layout (sidebar + topbar), pero recortado a lo que
// un instructor puede hacer: solo "Mis Cursos", nada de métricas, alumnos,
// landing ni instructores 
function AdminLayout({ modoInstructor = false }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const baseRuta = modoInstructor ? '/panel-instructor' : '/admin';

  const [busqueda, setBusqueda] = useState('');
  // Tema claro u oscuro del panel: se recuerda en este navegador
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem('admin-tema') || 'claro';
    } catch (e) {
      return 'claro';
    }
  });
  function alternarTema() {
    setTema((actual) => {
      const siguiente = actual === 'oscuro' ? 'claro' : 'oscuro';
      try {
        localStorage.setItem('admin-tema', siguiente);
      } catch (e) {
        // sin almacenamiento: el cambio dura hasta recargar
      }
      return siguiente;
    });
  }
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  const usuarioRef = useRef(null);

  useEffect(() => {
    function alHacerClickAfuera(e) {
      if (usuarioRef.current && !usuarioRef.current.contains(e.target)) setMenuUsuarioAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClickAfuera);
    return () => document.removeEventListener('mousedown', alHacerClickAfuera);
  }, []);

  // Preguntas sin responder (número junto a "Preguntas" en el menú)
  const [preguntasPendientes, setPreguntasPendientes] = useState(0);
  useEffect(() => {
    const contar = () => contarConsultasPendientesRequest().then((d) => setPreguntasPendientes(d.pendientes)).catch(() => {});
    contar();
    window.addEventListener('consultas-actualizadas', contar);
    return () => window.removeEventListener('consultas-actualizadas', contar);
  }, [location.pathname]);

  // Menú colapsable: en pantallas chicas el sidebar es un panel que se abre
  // con el botón del topbar y se cierra al navegar o al tocar el fondo.
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  function handleBuscar(e) {
    e.preventDefault();
    if (!busqueda.trim()) return;
    navigate(`${baseRuta}/cursos?buscar=${encodeURIComponent(busqueda.trim())}`);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const iniciales = usuario ? `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase() : '';

  return (
    <div className={`admin-shell ${tema === 'oscuro' ? 'admin-tema-oscuro' : ''}`}>
      {menuAbierto && (
        <button type="button" className="admin-backdrop" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />
      )}
      <aside className={`admin-sidebar ${menuAbierto ? 'abierto' : ''}`}>
        <div className="admin-sidebar-marca">
          <img src={logoElegant} alt="Elegant Music Studio" className="admin-sidebar-logo-img" />
          <div className="admin-sidebar-marca-nombre">Elegant Admin</div>
        </div>

        <nav className="admin-sidebar-nav">
          {modoInstructor ? (
            <div className="admin-sidebar-grupo">
              <p className="admin-sidebar-grupo-titulo">Mi trabajo</p>
              <NavLink
                to="/panel-instructor"
                className={() => `admin-sidebar-link ${!location.pathname.startsWith('/panel-instructor/preguntas') ? 'active' : ''}`}
              >
                <IconoCatalogo /> Mis Cursos
              </NavLink>
              <NavLink to="/panel-instructor/preguntas" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                <IconoPreguntas /> Preguntas
                {preguntasPendientes > 0 && <span className="admin-sidebar-contador">{preguntasPendientes}</span>}
              </NavLink>
            </div>
          ) : (
            <>
              <div className="admin-sidebar-grupo">
                <p className="admin-sidebar-grupo-titulo">General</p>
                <NavLink to="/admin" end className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                  <IconoDashboard /> Resumen
                </NavLink>
                <NavLink to="/admin/ventas" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                  <IconoMetricas /> Ventas
                </NavLink>
              </div>

              <div className="admin-sidebar-grupo">
                <p className="admin-sidebar-grupo-titulo">Académico</p>
                <NavLink to="/admin/cursos" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                  <IconoCatalogo /> Cursos
                </NavLink>
                <NavLink to="/admin/instructores" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                  <IconoInstructores /> Instructores
                </NavLink>
                <NavLink to="/admin/alumnos" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                  <IconoAlumnos /> Alumnos
                </NavLink>
                <NavLink to="/admin/preguntas" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                  <IconoPreguntas /> Preguntas
                  {preguntasPendientes > 0 && <span className="admin-sidebar-contador">{preguntasPendientes}</span>}
                </NavLink>
              </div>

              <div className="admin-sidebar-grupo">
                <p className="admin-sidebar-grupo-titulo">Sitio web</p>
                <NavLink to="/admin/landing" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
                  <IconoLanding /> Página de inicio
                </NavLink>
              </div>
            </>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-link admin-sidebar-volver">
            <IconoVolver /> Volver al sitio
          </Link>
        </div>
      </aside>

      <div className="admin-contenido">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <IconoMenu />
          </button>
          <form className="admin-busqueda" onSubmit={handleBuscar}>
            <IconoBusqueda />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </form>

          <div className="admin-topbar-acciones">
            <button
              type="button"
              className="admin-icono-btn"
              onClick={alternarTema}
              aria-label={tema === 'oscuro' ? 'Pasar a modo claro' : 'Pasar a modo oscuro'}
              title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
            >
              {tema === 'oscuro' ? <IconoSol /> : <IconoLuna />}
            </button>

            <CampanaNotificaciones />

            <div className="admin-topbar-menu" ref={usuarioRef}>
              <button
                type="button"
                className="admin-usuario-chip"
                aria-expanded={menuUsuarioAbierto}
                aria-label="Menú de la cuenta"
                onClick={() => setMenuUsuarioAbierto((v) => !v)}
              >
                <span className="admin-usuario-chip-texto">
                  <span className="admin-usuario-nombre">{usuario?.nombre} {usuario?.apellido}</span>
                  <span className="admin-usuario-rol">{modoInstructor ? 'Instructor' : 'Administrador'}</span>
                </span>
                <span className="admin-usuario-avatar admin-usuario-avatar--chico">{usuario?.fotoPerfil ? <img src={usuario.fotoPerfil} alt="" width="44" height="44" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }} /> : iniciales}</span>
              </button>
              {menuUsuarioAbierto && (
                <div className="admin-topbar-dropdown">
                  <div className="admin-topbar-dropdown-head">
                    <div className="admin-topbar-dropdown-nombre">{usuario?.nombre} {usuario?.apellido}</div>
                    <div className="admin-topbar-dropdown-sub">{usuario?.email}</div>
                  </div>
                  <Link to="/perfil" state={{ backgroundLocation: location }} onClick={() => setMenuUsuarioAbierto(false)}>Mi cuenta</Link>
                  <button type="button" onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

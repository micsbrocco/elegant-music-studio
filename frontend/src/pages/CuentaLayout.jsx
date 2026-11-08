import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICONO_PROPS = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconoPerfil() {
  return (
    <svg {...ICONO_PROPS}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconoCompras() {
  return (
    <svg {...ICONO_PROPS}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

const SECCIONES = [
  { to: '/perfil', etiqueta: 'Mi cuenta', Icono: IconoPerfil },
  { to: '/mis-compras', etiqueta: 'Mis compras', Icono: IconoCompras },
];

// Panel de la cuenta: arriba, siempre visible y centrada, la identidad del
// usuario; abajo, un panel con el menú lateral y la sección elegida.
function CuentaLayout() {
  const { usuario } = useAuth();

  return (
    <div className="cuenta-shell">
      <div className="container cuenta-shell-inner">
        <header className="cuenta-hero">
          {usuario?.fotoPerfil ? (
            <img src={usuario.fotoPerfil} referrerPolicy="no-referrer" alt="Foto de perfil" className="perfil-avatar" />
          ) : (
            <div className="perfil-avatar perfil-avatar-inicial">{usuario?.nombre?.[0]}</div>
          )}
          <div className="cuenta-hero-info">
            <p className="eyebrow cuenta-hero-eyebrow">Mi cuenta</p>
            <h1 className="cuenta-hero-nombre">{usuario?.nombre} {usuario?.apellido}</h1>
            <p className="cuenta-hero-email">{usuario?.email}</p>
          </div>
        </header>

        <div className="cuenta-panel">
          <nav className="cuenta-nav" aria-label="Secciones de la cuenta">
            {SECCIONES.map(({ to, etiqueta, Icono }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) => `cuenta-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icono />
                <span>{etiqueta}</span>
              </NavLink>
            ))}
          </nav>

          <section className="cuenta-contenido">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}

export default CuentaLayout;

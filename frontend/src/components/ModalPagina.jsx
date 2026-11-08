import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Ventana que se abre "arriba" de la página actual, igual que el login.
// Si se abrió desde otra página (state.backgroundLocation), al cerrar vuelve ahí.
// Si se entró directo por la URL, al cerrar lleva a Mis cursos.
function ModalPagina({ titulo, ancho = 480, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = location.state && location.state.backgroundLocation;
  // Abierta encima del panel en modo oscuro: la ventana también va en oscuro
  const [oscuro] = useState(() => Boolean(document.querySelector('.admin-shell.admin-tema-oscuro')));

  function cerrar() {
    if (backgroundLocation) {
      navigate(-1);
    } else {
      navigate('/mis-cursos');
    }
  }

  // Bloquea el scroll de fondo y permite cerrar con Escape
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

  return (
    <div
      className={`modal-pagina-overlay ${oscuro ? 'modal-tema-oscuro' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className="modal-pagina" style={{ maxWidth: ancho }} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-pagina-cab">
          <h2 className="modal-pagina-titulo">{titulo}</h2>
          <button type="button" className="modal-pagina-cerrar" onClick={cerrar} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
        <div className="modal-pagina-cuerpo">{children}</div>
      </div>
    </div>
  );
}

export default ModalPagina;

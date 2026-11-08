import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { listarCursosRequest } from '../services/cursoService';
import { agregarAlCarritoRequest } from '../services/carritoService';
import { agregarAlCarritoInvitado } from '../services/carritoInvitado';
import { crearPreferenciaRequest } from '../services/pagoService';
import { misCursosRequest } from '../services/inscripcionService';
import { useAuth } from '../context/AuthContext';
import Revelar from './Revelar';
import { SkeletonCatalogo } from './Skeleton';
import PortadaCurso from './PortadaCurso';
import { formatearPrecio } from '../utils/formato';

// limite: cuántos cursos mostrar como máximo (null = todos).
// ocultarPropios: si es true, no muestra los cursos que el usuario ya tiene
// (se usa en "Explorar cursos" dentro de Mis cursos).
// mensajeVacio: texto a mostrar cuando no queda ningún curso para listar.
// estilo: 'clasico' (tarjetas de la landing) o 'moderno' (catálogo y Mis cursos).
// conFiltros: muestra buscador y filtro por categoría arriba de la grilla.
// tresColumnas: fija la grilla en 3 columnas que ocupan todo el ancho (landing).
function CatalogoCursos({
  limite = null,
  ocultarPropios = false,
  mensajeVacio = 'Todavía no hay cursos disponibles.',
  estilo = 'clasico',
  conFiltros = false,
  tresColumnas = false,
}) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  // IDs de los cursos que el usuario ya tiene (para no ofrecerle comprarlos de nuevo)
  const [cursosPropios, setCursosPropios] = useState(new Set());
  const [propiosCargados, setPropiosCargados] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');

  useEffect(() => {
    cargarCursos();
  }, []);

  useEffect(() => {
    if (!usuario) {
      setCursosPropios(new Set());
      setPropiosCargados(true);
      return;
    }
    misCursosRequest()
      .then((inscripciones) => setCursosPropios(new Set(inscripciones.map((i) => i.idCurso))))
      .catch(() => {
        // si falla, el catálogo se muestra igual con los botones de compra
      })
      .finally(() => setPropiosCargados(true));
  }, [usuario]);

  async function cargarCursos() {
    try {
      const data = await listarCursosRequest();
      setCursos(data);
    } catch (err) {
      setError('Error al cargar los cursos');
    } finally {
      setCargando(false);
    }
  }

  // Categorías disponibles para el filtro (en el orden en que aparecen)
  const categorias = useMemo(
    () => [...new Set(cursos.map((c) => c.categoria).filter(Boolean))],
    [cursos]
  );

  // El cartel de "agregado al carrito" es flotante y se cierra solo.
  useEffect(() => {
    if (!mensaje) return;
    const temporizador = setTimeout(() => setMensaje(''), 2500);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  async function handleAgregarCarrito(cursoId) {
    setMensaje('');

    // Sin sesión: el carrito se guarda en este navegador, no en la base de datos.
    if (!usuario) {
      agregarAlCarritoInvitado(cursoId);
      setMensaje('Curso agregado al carrito. Iniciá sesión para completar la compra.');
      return;
    }

    try {
      await agregarAlCarritoRequest(cursoId);
      setMensaje('Curso agregado al carrito');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al agregar al carrito');
    }
  }

  async function handleComprarAhora(cursoId) {
    setMensaje('');

    // El pago se asocia a un usuario, así que sin sesión mandamos a
    // iniciar sesión primero.
    if (!usuario) {
      navigate('/login', { state: { backgroundLocation: location } });
      return;
    }

    try {
      const { initPoint } = await crearPreferenciaRequest([cursoId]);
      window.location.href = initPoint;
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al procesar la compra');
    }
  }

  // Si hay que ocultar los cursos propios, se espera a saber cuáles son
  // para que no aparezcan un instante y después desaparezcan.
  if (cargando || (ocultarPropios && !propiosCargados)) {
    return <SkeletonCatalogo cantidad={limite || 6} />;
  }
  if (error) return <p className="error-box">{error}</p>;

  // Primero se sacan los cursos propios (si corresponde), después se aplican
  // búsqueda y categoría, y al final se recorta: así "Explorar cursos" siempre
  // muestra la cantidad pedida de cursos nuevos.
  const texto = busqueda.trim().toLowerCase();
  const filtrados = cursos
    .filter((c) => !ocultarPropios || !cursosPropios.has(c.id))
    .filter((c) => categoria === 'todas' || c.categoria === categoria)
    .filter((c) => !texto
      || c.titulo.toLowerCase().includes(texto)
      || (c.descripcion || '').toLowerCase().includes(texto)
      || (c.categoria || '').toLowerCase().includes(texto));
  const visibles = limite ? filtrados.slice(0, limite) : filtrados;

  if (estilo === 'moderno') {
    return (
      <div>
        {mensaje && <div className="success-box toast-notificacion">{mensaje}</div>}

        {conFiltros && (
          <FiltrosCatalogo
            categorias={categorias}
            categoria={categoria}
            onCategoria={setCategoria}
            busqueda={busqueda}
            onBusqueda={setBusqueda}
          />
        )}

        {visibles.length === 0 ? (
          <p className="cat-vacio">
            {cursos.length > 0 && (texto || categoria !== 'todas')
              ? 'No encontramos cursos con esa búsqueda.'
              : mensajeVacio}
          </p>
        ) : (
          <div className={`cat-grilla ${tresColumnas ? 'cat-grilla--3' : ''}`}>
            {visibles.map((curso, i) => (
              <Revelar key={curso.id} retraso={(i % 3) * 80} className="cat-card-wrap">
                <TarjetaCatalogo
                  curso={curso}
                  propio={cursosPropios.has(curso.id)}
                  onAgregarCarrito={() => handleAgregarCarrito(curso.id)}
                  onComprar={() => handleComprarAhora(curso.id)}
                />
              </Revelar>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (visibles.length === 0) return <p className="text-muted">{mensajeVacio}</p>;

  return (
    <div>
      {mensaje && <div className="success-box toast-notificacion">{mensaje}</div>}

      <div className="courses-grid">
        {visibles.map((curso, i) => (
          <Revelar key={curso.id} retraso={(i % 3) * 100} className="course-card">
            {curso.imagenPortada && (
              <div className="course-card-image">
                <img src={curso.imagenPortada} alt={curso.titulo} />
              </div>
            )}

            <div className="course-card-body">
              <p className="course-card-categoria">{curso.categoria}</p>
              <h3 className="course-card-title">{curso.titulo}</h3>
              {(curso.nivel || curso.emiteCertificado) && (
                <p className="course-card-meta">
                  {[curso.nivel, curso.emiteCertificado ? 'Certificado' : null].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="course-card-desc">{curso.descripcion}</p>

              {cursosPropios.has(curso.id) ? (
                <div className="course-card-pills">
                  <span className="course-card-pill course-card-pill--oferta">Ya tenés este curso</span>
                </div>
              ) : (
                Number(curso.precioOriginal) > Number(curso.precio) && (
                  <div className="course-card-pills">
                    <span className="course-card-pill course-card-pill--oferta">Oferta</span>
                  </div>
                )
              )}

              <div className="course-card-footer">
                <span>
                  <span className="course-card-price">${curso.precio}</span>
                  {Number(curso.precioOriginal) > Number(curso.precio) && (
                    <span className="course-card-price-original">${curso.precioOriginal}</span>
                  )}
                </span>
                <Link to={`/cursos/${curso.id}`} className="course-card-cta">
                  Ver curso
                  <span className="hero-btn-arrow">→</span>
                </Link>
              </div>

              <div className="course-card-actions">
                {cursosPropios.has(curso.id) ? (
                  <Link to={`/cursos/${curso.id}/aprender`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                    Ir al curso
                  </Link>
                ) : (
                  <>
                    <button onClick={() => handleAgregarCarrito(curso.id)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                      🛒 Agregar
                    </button>
                    <button onClick={() => handleComprarAhora(curso.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      Comprar
                    </button>
                  </>
                )}
              </div>
            </div>
          </Revelar>
        ))}
      </div>
    </div>
  );
}

/* ---------- Buscador + categorías (catálogo completo) ---------- */
function FiltrosCatalogo({ categorias, categoria, onCategoria, busqueda, onBusqueda }) {
  return (
    <div className="cat-filtros">
      <label className="cat-buscador">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          placeholder="Buscar cursos"
          aria-label="Buscar cursos"
        />
      </label>
      {categorias.length > 1 && (
        <div className="cat-chips" role="group" aria-label="Filtrar por categoría">
          {['todas', ...categorias].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-chip ${categoria === cat ? 'activo' : ''}`}
              onClick={() => onCategoria(cat)}
              aria-pressed={categoria === cat}
            >
              {cat === 'todas' ? 'Todas' : cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Tarjeta moderna ----------
 * Toda la tarjeta lleva a la página del curso (el link del título se estira por
 * encima); los botones de compra y carrito quedan por arriba de ese link. */
function TarjetaCatalogo({ curso, propio, onAgregarCarrito, onComprar }) {
  const hayDescuento = Number(curso.precioOriginal) > Number(curso.precio);
  const ahorro = hayDescuento
    ? Math.round((1 - Number(curso.precio) / Number(curso.precioOriginal)) * 100)
    : 0;
  const meta = [curso.nivel, curso.emiteCertificado ? 'Certificado' : null].filter(Boolean).join(' · ');

  return (
    <article className="cat-card">
      <div className="cat-card-portada">
        <PortadaCurso curso={curso} />
        {curso.categoria && <span className="cat-card-chip">{curso.categoria}</span>}
        {propio ? (
          <span className="cat-card-insignia cat-card-insignia--propio">Ya lo tenés</span>
        ) : hayDescuento && (
          <span className="cat-card-insignia">-{ahorro}%</span>
        )}
      </div>

      <div className="cat-card-cuerpo">
        <h3 className="cat-card-titulo">
          <Link to={`/cursos/${curso.id}`} className="cat-card-enlace">{curso.titulo}</Link>
        </h3>
        {meta && <p className="cat-card-meta">{meta}</p>}
        <p className="cat-card-desc">{curso.descripcion}</p>

        <div className="cat-card-pie">
          {propio ? (
            <Link to={`/cursos/${curso.id}/aprender`} className="cat-btn cat-btn--principal cat-btn--ancho">
              Ir al curso
            </Link>
          ) : (
            <>
              <div className="cat-card-precios">
                <span className="cat-card-precio">{formatearPrecio(curso.precio)}</span>
                {hayDescuento && <span className="cat-card-precio-original">{formatearPrecio(curso.precioOriginal)}</span>}
              </div>
              <div className="cat-card-acciones">
                <button type="button" className="cat-btn cat-btn--icono" onClick={onAgregarCarrito} aria-label="Agregar al carrito" title="Agregar al carrito">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                </button>
                <button type="button" className="cat-btn cat-btn--principal" onClick={onComprar}>
                  Comprar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default CatalogoCursos;
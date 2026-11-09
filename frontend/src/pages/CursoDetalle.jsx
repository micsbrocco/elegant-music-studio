import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { obtenerCursoRequest } from '../services/cursoService';
import { verificarInscripcionRequest } from '../services/inscripcionService';
import { crearPreferenciaRequest } from '../services/pagoService';
import { agregarAlCarritoRequest } from '../services/carritoService';
import { agregarFavoritoRequest } from '../services/favoritoService';
import { obtenerProgresoCursoRequest } from '../services/progresoService';
import { emitirCertificadoRequest } from '../services/certificadoService';
import { useAuth } from '../context/AuthContext';
import { formatearPrecio } from '../utils/formato';
import { SkeletonDetalleCurso } from '../components/Skeleton';
import PortadaCurso from '../components/PortadaCurso';
import Proximamente from './Proximamente';

const ICONOS_TIPO = {
  video: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  lectura: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  quiz: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
};

// Íconos de las estadísticas: trazo fino de 1.5, monocromos (toman el color del
// texto), dibujados a medida para que se vean livianos y "premium".
const PROPS_STAT = {
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};
const ICONOS_STAT = {
  // Capas apiladas: los módulos del curso
  modulos: (
    <svg {...PROPS_STAT}>
      <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
      <path d="M3 12l9 4.5 9-4.5" />
      <path d="M3 16.5L12 21l9-4.5" />
    </svg>
  ),
  // Play dentro de un círculo: las clases
  clases: (
    <svg {...PROPS_STAT}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5.5 3.5-5.5 3.5v-7z" />
    </svg>
  ),
  // Cronómetro
  duracion: (
    <svg {...PROPS_STAT}>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.5" />
      <path d="M10 2.5h4" />
      <path d="M18.5 6.5l1.5-1.5" />
    </svg>
  ),
  // Auriculares
  practicas: (
    <svg {...PROPS_STAT}>
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  ),
  // Pantalla con forma de onda: el software
  software: (
    <svg {...PROPS_STAT}>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M6.5 11h1.5l1.5-3 2 6 2-4.5 1.5 1.5h2.5" />
      <path d="M9 21h6" />
    </svg>
  ),
  // Medalla
  certificacion: (
    <svg {...PROPS_STAT}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" />
      <path d="M10 9l1.5 1.5L14.5 7.5" />
    </svg>
  ),
  // Destello
  general: (
    <svg {...PROPS_STAT}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" />
    </svg>
  ),
};

function IconoCandado() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconoCarrito() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function IconoCorazon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconoFlecha() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

// Descripción del curso: si ocupa más de 3 líneas se recorta y aparece
// "Leer más"; al abrirla, el botón pasa a "Ocultar".
function DescripcionCurso({ texto }) {
  const ref = useRef(null);
  const [abierta, setAbierta] = useState(false);
  const [esLarga, setEsLarga] = useState(false);

  useLayoutEffect(() => {
    function medir() {
      const el = ref.current;
      if (!el || abierta) return;
      setEsLarga(el.scrollHeight > el.clientHeight + 1);
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [texto, abierta]);

  return (
    <div className="curso-detalle-desc-wrap">
      <p ref={ref} className={`curso-detalle-desc ${abierta ? '' : 'recortada'}`}>{texto}</p>
      {(esLarga || abierta) && (
        <button type="button" className="curso-leer-mas" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
          {abierta ? 'Ocultar' : 'Leer más'}
        </button>
      )}
    </div>
  );
}

function CursoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [inscripto, setInscripto] = useState(false);
  const [cerrado, setCerrado] = useState(false);
  // El admin entra a cualquier curso sin comprarlo
  const esAdmin = usuario?.rol === 'admin';
  const puedeEntrar = inscripto || esAdmin;
  const [progreso, setProgreso] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState(false);
  const [generandoCertificado, setGenerandoCertificado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  // Módulos abiertos (pueden estar abiertos varios a la vez)
  const [modulosAbiertos, setModulosAbiertos] = useState(() => new Set());

  useEffect(() => {
    cargarDatos();
  }, [id, usuario]);

  async function cargarDatos() {
    try {
      const dataCurso = await obtenerCursoRequest(id);
      setCurso(dataCurso);
      setModulosAbiertos(new Set(dataCurso.modulos[0] ? [dataCurso.modulos[0].id] : []));

      if (usuario) {
        const dataInscripcion = await verificarInscripcionRequest(id);
        setInscripto(dataInscripcion.inscripto);

        if (dataInscripcion.inscripto) {
          const dataProgreso = await obtenerProgresoCursoRequest(id);
          setProgreso(dataProgreso);
        }
      }
    } catch (err) {
      // Sitio en "Próximamente": el curso no se muestra al público
      if (err.response?.data?.codigo === 'PROXIMAMENTE') setCerrado(true);
      setError('No se pudo cargar el curso');
    } finally {
      setCargando(false);
    }
  }

  async function handleComprar() {
    setComprando(true);
    setError('');
    try {
      const { initPoint } = await crearPreferenciaRequest([id]);
      window.location.href = initPoint;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la compra');
    } finally {
      setComprando(false);
    }
  }

  async function handleAgregarCarrito() {
    setMensaje('');
    setError('');
    try {
      await agregarAlCarritoRequest(id);
      setMensaje('Curso agregado al carrito');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar al carrito');
    }
  }

  async function handleAgregarFavorito() {
    setMensaje('');
    setError('');
    try {
      await agregarFavoritoRequest(id);
      setMensaje('Curso agregado a favoritos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar a favoritos');
    }
  }

  function handleAbrirContenido(contenidoId) {
    navigate(`/cursos/${id}/aprender`, { state: { contenidoId } });
  }

  async function handleVerCertificado() {
    const nuevaPestana = window.open('', '_blank');
    setGenerandoCertificado(true);
    try {
      const certificado = await emitirCertificadoRequest(progreso.inscripcionId);
      nuevaPestana.location.href = certificado.urlPdf;
    } catch (err) {
      nuevaPestana.close();
      alert(err.response?.data?.error || 'Error al generar el certificado');
    } finally {
      setGenerandoCertificado(false);
    }
  }

  if (cargando) return <SkeletonDetalleCurso />;
  if (cerrado) return <Proximamente />;
  if (!curso) return <p className="text-muted" style={{ padding: 60, textAlign: 'center' }}>Curso no encontrado</p>;

  const totalContenidos = curso.modulos.reduce((acc, m) => acc + m.contenidos.length, 0);
  const instructoresVisibles = curso.instructoresVisibles && curso.instructoresVisibles.length > 0
    ? curso.instructoresVisibles
    : [{ etiqueta: null, usuario: curso.adminCreador }];

  const hayDescuento = curso.precioOriginal && Number(curso.precioOriginal) > Number(curso.precio);
  const porcentajeAhorro = hayDescuento
    ? Math.round((1 - Number(curso.precio) / Number(curso.precioOriginal)) * 100)
    : 0;

  return (
    <div className="curso-detalle-page">
      <div className="container curso-detalle-grid">
        {/* Columna principal */}
        <div className="curso-detalle-principal">
          <nav className="curso-breadcrumb">
            <Link to="/cursos">Cursos</Link> <span>/</span> <span>{curso.categoria}</span>
          </nav>

          <div className="curso-badges-row">
            <span className="cd-chip cd-chip--dorado">{curso.categoria}</span>
            {curso.nivel && <span className="cd-chip">{curso.nivel}</span>}
          </div>

          <h1 className="curso-detalle-titulo">{curso.titulo}</h1>
          <DescripcionCurso texto={curso.descripcion} />

          <div className="curso-stats-row">
            <div className="curso-stat curso-stat--modulos">
              <span className="curso-stat-icono">{ICONOS_STAT.modulos}</span>
              <span className="curso-stat-texto curso-stat-texto--inline">
                <span className="curso-stat-valor">{curso.modulos.length}</span>
                <span className="curso-stat-label">Módulos</span>
              </span>
            </div>
            <div className="curso-stat curso-stat--clases">
              <span className="curso-stat-icono">{ICONOS_STAT.clases}</span>
              <span className="curso-stat-texto curso-stat-texto--inline">
                <span className="curso-stat-valor">{totalContenidos}</span>
                <span className="curso-stat-label">Clases</span>
              </span>
            </div>
            {(curso.estadisticas || []).map((est, i) => (
              <div key={i} className={`curso-stat curso-stat--${ICONOS_STAT[est.icono] ? est.icono : 'general'}`}>
                <span className="curso-stat-icono">{ICONOS_STAT[est.icono] || ICONOS_STAT.general}</span>
                <span className="curso-stat-texto">
                  <span className="curso-stat-valor curso-stat-valor-chica">{est.titulo}</span>
                  {est.subtitulo && <span className="curso-stat-label">{est.subtitulo}</span>}
                </span>
              </div>
            ))}
          </div>

          <h2 className="curso-seccion-titulo curso-seccion-programa">Programa</h2>

          <div className="curso-modulos">
            {curso.modulos.map((modulo, i) => {
              const abierto = modulosAbiertos.has(modulo.id);
              return (
                <div key={modulo.id} className={`modulo-acordeon ${abierto ? 'abierto' : ''}`}>
                  <button
                    type="button"
                    className="modulo-header"
                    onClick={() => setModulosAbiertos((actuales) => {
                      const siguientes = new Set(actuales);
                      if (siguientes.has(modulo.id)) siguientes.delete(modulo.id);
                      else siguientes.add(modulo.id);
                      return siguientes;
                    })}
                    aria-expanded={abierto}
                  >
                    <span className="modulo-numero" aria-label={`Módulo ${i + 1}`}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="modulo-header-info">
                      <span className="modulo-titulo">{modulo.titulo}</span>
                      <span className="modulo-meta">
                        {modulo.contenidos.length} {modulo.contenidos.length === 1 ? 'clase' : 'clases'}
                      </span>
                    </span>
                    <svg className="modulo-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Siempre montado para poder animar la apertura; "inert" lo saca del Tab cuando está cerrado */}
                  <div className="modulo-cuerpo" inert={!abierto}>
                    <div className="modulo-contenidos">
                      {modulo.contenidos.map((contenido) => {
                        const completado = Boolean(progreso?.contenidosCompletados?.includes(contenido.id));
                        return (
                          <div
                            key={contenido.id}
                            className={`contenido-item ${puedeEntrar ? 'desbloqueado' : 'bloqueado'}`}
                            onClick={puedeEntrar ? () => handleAbrirContenido(contenido.id) : undefined}
                            role={puedeEntrar ? 'button' : undefined}
                            tabIndex={puedeEntrar ? 0 : undefined}
                          >
                            <span className="contenido-icono">{ICONOS_TIPO[contenido.tipo] || ICONOS_TIPO.lectura}</span>
                            <span className="contenido-titulo">{contenido.titulo}</span>
                            <span className="contenido-candado">
                              {puedeEntrar ? (completado ? <IconoCheck /> : <IconoFlecha />) : <IconoCandado />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar de compra */}
        <aside className="curso-sidebar">
          <div className="curso-sidebar-card">
            <PortadaCurso curso={curso} className="curso-sidebar-portada" />
            <div className="curso-sidebar-body">
              {usuario && inscripto ? (
                <>
                  <div className="curso-progreso-header">
                    <span className="curso-progreso-pct">{progreso?.porcentaje ?? 0}%</span>
                    <span className="curso-progreso-label">completado</span>
                  </div>
                  <div className="curso-progreso-track">
                    <div className="curso-progreso-fill" style={{ width: `${progreso?.porcentaje ?? 0}%` }} />
                  </div>

                  {progreso?.completado && (
                    <div className="success-box">¡Completaste el curso!</div>
                  )}

                  {error && <div className="error-box">{error}</div>}

                  <div className="curso-acciones-inscripto">
                    <Link to={`/cursos/${id}/aprender`} className="btn btn-primary auth-submit" style={{ textDecoration: 'none' }}>
                      {progreso?.completado ? 'Repasar el curso' : 'Continuar donde lo dejaste'}
                    </Link>

                    {progreso?.completado && (
                      <button
                        onClick={handleVerCertificado}
                        disabled={generandoCertificado}
                        className="btn btn-outline curso-boton-certificado"
                      >
                        {generandoCertificado ? 'Generando...' : 'Ver certificado'}
                      </button>
                    )}
                  </div>

                  {curso.incluye && curso.incluye.length > 0 && (
                    <div className="curso-incluye-separador curso-incluye--inscripto">
                      <p className="curso-incluye-titulo">Tu inscripción incluye</p>
                      <ul className="curso-incluye-checklist">
                        {curso.incluye.map((item, i) => (
                          <li key={i}>
                            <IconoCheck />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="curso-sidebar-precio-row">
                    <span className="curso-sidebar-precio">{formatearPrecio(curso.precio)}</span>
                    {hayDescuento && (
                      <>
                        <span className="curso-sidebar-precio-original">{formatearPrecio(curso.precioOriginal)}</span>
                        <span className="curso-sidebar-ahorro">Ahorrás {porcentajeAhorro}%</span>
                      </>
                    )}
                  </div>

                  {curso.incluye && curso.incluye.length > 0 && (
                    <ul className="curso-incluye-checklist">
                      {curso.incluye.map((item, i) => (
                        <li key={i}>
                          <IconoCheck />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {error && <div className="error-box">{error}</div>}
                  {mensaje && <div className="success-box">{mensaje}</div>}

                  {!usuario && (
                    <div className="curso-cta-row">
                      <Link to="/registro" state={{ backgroundLocation: location }} className="btn btn-primary auth-submit" style={{ textDecoration: 'none', flex: 1 }}>
                        Inscribirme — {formatearPrecio(curso.precio)}
                      </Link>
                      <Link to="/login" state={{ backgroundLocation: location }} className="btn btn-outline" style={{ textDecoration: 'none' }}>
                        Ingresar
                      </Link>
                    </div>
                  )}

                  {esAdmin && !inscripto && (
                    <Link to={`/cursos/${id}/aprender`} className="btn btn-primary auth-submit" style={{ textDecoration: 'none' }}>
                      Entrar al curso
                    </Link>
                  )}

                  {usuario && !inscripto && !esAdmin && (
                    <>
                      <button onClick={handleComprar} disabled={comprando} className="btn btn-primary auth-submit">
                        {comprando ? 'Procesando...' : `Comprar ahora (${formatearPrecio(curso.precio)})`}
                      </button>
                      <div className="curso-sidebar-actions">
                        <button onClick={handleAgregarCarrito} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                          <IconoCarrito /> Al carrito
                        </button>
                        <button onClick={handleAgregarFavorito} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                          <IconoCorazon /> Favorito
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {instructoresVisibles.length > 0 && (
            <div className="curso-instructores-lista">
              {instructoresVisibles.map(({ etiqueta, usuario: instructor }, indice) => (
                <div key={instructor.id || indice} className="curso-instructor-card curso-instructor-card-sidebar">
                  <div className="curso-instructor-foto">
                    {instructor.fotoPerfil ? (
                      <img src={instructor.fotoPerfil} alt={`${instructor.nombre} ${instructor.apellido}`} />
                    ) : (
                      <span>{instructor.nombre[0]}</span>
                    )}
                  </div>
                  <div>
                    {/* Arriba siempre dice "Instructor": es una etiqueta fija, no editable
                        desde el panel (eso generaba confusión con el campo de abajo). */}
                    <p className="curso-instructor-label">
                      Instructor
                      <span className="curso-instructor-verificado" title="Instructor oficial">
                        <IconoCheck />
                      </span>
                    </p>
                    <p className="curso-instructor-nombre">{instructor.nombre} {instructor.apellido}</p>
                    {etiqueta && (
                      <p className="curso-instructor-rol">{etiqueta}</p>
                    )}
                    {instructor.descripcion && (
                      <p className="text-muted curso-instructor-bio">{instructor.descripcion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default CursoDetalle;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { misCursosRequest } from '../services/inscripcionService';
import { emitirCertificadoRequest } from '../services/certificadoService';
import { useAuth } from '../context/AuthContext';
import { SkeletonMisCursos } from '../components/Skeleton';
import CatalogoCursos from '../components/CatalogoCursos';
import PanelCuenta from '../components/PanelCuenta';
import PortadaCurso from '../components/PortadaCurso';
import FiltroSegmentado from '../components/FiltroSegmentado';
import { useSitio } from '../context/SitioContext';

function estaCompleto(inscripcion) {
  return inscripcion.completado
    || (inscripcion.totalClases > 0 && inscripcion.clasesCompletadas >= inscripcion.totalClases);
}

function porcentajeDe(inscripcion) {
  if (estaCompleto(inscripcion)) return 100;
  if (!inscripcion.totalClases) return 0;
  return Math.round((inscripcion.clasesCompletadas / inscripcion.totalClases) * 100);
}

// Texto corto del avance: "Sin empezar", "Clase 4 de 8" o "Completado".
function textoAvance(inscripcion) {
  if (estaCompleto(inscripcion)) return 'Completado';
  if (!inscripcion.totalClases) return 'Todavía no tiene clases';
  if (inscripcion.clasesCompletadas === 0) return 'Sin empezar';
  const numero = inscripcion.siguienteClase?.numero ?? inscripcion.clasesCompletadas;
  return `Clase ${numero} de ${inscripcion.totalClases}`;
}

// Link a la cursada que abre directo en la clase que le toca.
function linkCursada(inscripcion) {
  return {
    to: `/cursos/${inscripcion.curso.id}/aprender`,
    state: inscripcion.siguienteClase ? { contenidoId: inscripcion.siguienteClase.id } : undefined,
  };
}

// El curso a destacar: el último en el que avanzó y que no terminó. Si todavía no
// avanzó en ninguno, el último que compró.
function elegirDestacado(inscripciones) {
  const candidatos = inscripciones.filter((i) => !estaCompleto(i) && i.totalClases > 0);
  if (candidatos.length === 0) return null;
  return [...candidatos].sort((a, b) => {
    const fa = a.ultimaActividad ? new Date(a.ultimaActividad).getTime() : 0;
    const fb = b.ultimaActividad ? new Date(b.ultimaActividad).getTime() : 0;
    if (fa !== fb) return fb - fa;
    return new Date(b.fechaInscripcion) - new Date(a.fechaInscripcion);
  })[0];
}

function MisCursos() {
  const { usuario } = useAuth();
  const { cursosCerrados } = useSitio();

  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [generandoCertificado, setGenerandoCertificado] = useState(null);
  // Por defecto se ven los cursos en progreso, que es lo que el alumno quiere retomar.
  const [filtro, setFiltro] = useState('progreso'); // 'progreso' | 'completados'

  useEffect(() => {
    cargarMisCursos();
  }, []);

  async function cargarMisCursos() {
    try {
      // El backend ya devuelve el avance de cada curso (clases totales, completadas
      // y la siguiente), así que no hace falta pedir el progreso curso por curso.
      const data = await misCursosRequest();
      setInscripciones(data);

      // Si no tiene nada en progreso pero sí cursos terminados, se arranca en "Completados"
      // para no mostrarle una lista vacía.
      const hayEnProgreso = data.some((i) => !estaCompleto(i));
      if (!hayEnProgreso && data.length > 0) setFiltro('completados');
    } catch (err) {
      setError('No se pudieron cargar tus cursos');
    } finally {
      setCargando(false);
    }
  }

  async function handleVerCertificado(inscripcionId) {
    const nuevaPestana = window.open('', '_blank');
    setGenerandoCertificado(inscripcionId);
    try {
      const certificado = await emitirCertificadoRequest(inscripcionId);
      nuevaPestana.location.href = certificado.urlPdf;
    } catch (err) {
      nuevaPestana.close();
      alert(err.response?.data?.error || 'Error al generar el certificado');
    } finally {
      setGenerandoCertificado(null);
    }
  }

  if (cargando) return <SkeletonMisCursos />;
  if (error) {
    return <div className="error-box" style={{ maxWidth: 480, margin: '60px auto' }}>{error}</div>;
  }

  const destacado = elegirDestacado(inscripciones);

  const visibles = inscripciones.filter((i) => {
    if (filtro === 'progreso') return !estaCompleto(i);
    if (filtro === 'completados') return estaCompleto(i);
    return true;
  });

  const pestanas = [
    { id: 'progreso', etiqueta: 'En progreso' },
    { id: 'completados', etiqueta: 'Completados' },
  ];

  return (
    <div className="portal-page portal-layout">
      <div className="portal-principal">
        <div className="container">
          <Bienvenida nombre={usuario?.nombre} />

          {destacado && (
            <Destacado inscripcion={destacado} />
          )}

          {inscripciones.length === 0 ? (
            <div className="portal-vacio">
              <p className="portal-vacio-titulo">Todavía no tenés cursos</p>
              <p className="portal-vacio-texto">Abajo tenés algunos para empezar, o mirá el catálogo completo.</p>
              <Link to="/cursos" className="btn btn-primary btn-sm">Ver catálogo</Link>
            </div>
          ) : (
            <section aria-label="Tus cursos">
              <FiltroSegmentado opciones={pestanas} valor={filtro} onCambiar={setFiltro} etiqueta="Filtrar cursos" />

              {visibles.length === 0 ? (
                <p className="portal-filtro-vacio">
                  {filtro === 'progreso' ? 'No tenés cursos en progreso.' : 'Todavía no completaste ningún curso.'}
                </p>
              ) : (
                <div className="mc-grilla">
                  {visibles.map((inscripcion) => (
                    <TarjetaMiCurso
                      key={inscripcion.id}
                      inscripcion={inscripcion}
                      generandoCertificado={generandoCertificado === inscripcion.id}
                      onVerCertificado={() => handleVerCertificado(inscripcion.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Explorar cursos: algunos cursos que todavía no tiene, con acceso al catálogo completo
              (no se muestra en modo "Próximamente") */}
          {!cursosCerrados && (
          <section className="portal-explorar">
            <div className="portal-explorar-cab">
              <h2 className="portal-explorar-titulo">Explorar cursos</h2>
              <Link to="/cursos" className="portal-explorar-link">
                Ver más
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <CatalogoCursos
              estilo="moderno"
              limite={3}
              ocultarPropios
              mensajeVacio="Ya tenés todos los cursos disponibles. ¡Pronto vamos a sumar más!"
            />
          </section>
          )}
        </div>
      </div>

      <PanelCuenta />
    </div>
  );
}

/* ---------- Bienvenida ----------
 * Saludo simple y, a la derecha, un ecualizador dorado animado que retoma el
 * motivo del logo del estudio. */
function Bienvenida({ nombre }) {
  const barras = [38, 62, 46, 80, 55, 92, 68, 44, 74, 52, 86, 60, 40, 70, 50];
  return (
    <header className="mc-bienvenida">
      <div className="mc-bienvenida-texto">
        <h1 className="mc-bienvenida-titulo">Hola, {nombre}</h1>
        <p className="mc-bienvenida-resumen">¡Qué bueno verte de nuevo!</p>
      </div>
      <div className="mc-ecualizador" aria-hidden="true">
        {barras.map((alto, i) => (
          <span key={i} style={{ height: `${alto}%`, animationDelay: `${(i % 5) * -0.35}s` }} />
        ))}
      </div>
    </header>
  );
}

/* ---------- "Continuá donde lo dejaste" ---------- */
function Destacado({ inscripcion }) {
  const { curso, siguienteClase } = inscripcion;
  const empezo = inscripcion.clasesCompletadas > 0;
  const porcentaje = porcentajeDe(inscripcion);
  const destino = linkCursada(inscripcion);

  return (
    <section className="mc-destacado" aria-label="Continuá donde lo dejaste">
      <PortadaCurso curso={curso} className="mc-destacado-portada" />
      <div className="mc-destacado-info">
        <p className="mc-destacado-eyebrow">{empezo ? 'Continuá donde lo dejaste' : 'Empezá tu curso'}</p>
        <h2 className="mc-destacado-titulo">{curso.titulo}</h2>
        {siguienteClase && (
          <p className="mc-destacado-clase">
            <span>{siguienteClase.modulo}</span>
            <span aria-hidden="true"> · </span>
            <span>Clase {siguienteClase.numero} de {inscripcion.totalClases}: {siguienteClase.titulo}</span>
          </p>
        )}
        <div className="mc-destacado-pie">
          <div className="mc-progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del curso">
            <div className="mc-progreso-relleno" style={{ width: `${porcentaje}%` }} />
          </div>
          <span className="mc-destacado-pct">{porcentaje}%</span>
          <Link to={destino.to} state={destino.state} className="btn btn-primary mc-destacado-btn">
            {empezo ? 'Continuar' : 'Empezar'}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Tarjeta de un curso propio ----------
 * Toda la tarjeta es clickeable (el link del título se estira por encima) y lleva
 * a la cursada, en la clase que le toca. El botón de certificado queda por encima. */
function TarjetaMiCurso({ inscripcion, generandoCertificado, onVerCertificado }) {
  const { curso } = inscripcion;
  const completo = estaCompleto(inscripcion);
  const porcentaje = porcentajeDe(inscripcion);
  const destino = linkCursada(inscripcion);

  return (
    <article className={`mc-card ${completo ? 'mc-card--completo' : ''}`}>
      <div className="mc-card-portada">
        <PortadaCurso curso={curso} />
        {curso.categoria && <span className="mc-chip">{curso.categoria}</span>}
      </div>
      <div className="mc-card-cuerpo">
        <h3 className="mc-card-titulo">
          <Link to={destino.to} state={destino.state} className="mc-card-enlace">{curso.titulo}</Link>
        </h3>
        <div className="mc-progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del curso">
          <div className="mc-progreso-relleno" style={{ width: `${porcentaje}%` }} />
        </div>
        <div className="mc-card-pie">
          <span className={`mc-avance ${completo ? 'mc-avance--completo' : ''}`}>
            {completo && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {textoAvance(inscripcion)}
          </span>
          {completo && curso.emiteCertificado ? (
            <button type="button" className="mc-certificado" onClick={onVerCertificado} disabled={generandoCertificado}>
              {generandoCertificado ? 'Generando...' : 'Certificado'}
            </button>
          ) : (
            !completo && porcentaje > 0 && <span className="mc-pct">{porcentaje}%</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default MisCursos;

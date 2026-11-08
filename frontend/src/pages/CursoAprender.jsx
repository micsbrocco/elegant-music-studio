import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { obtenerCursoRequest } from '../services/cursoService';
import { marcarProgresoRequest, obtenerProgresoCursoRequest, marcarVideoVistoRequest } from '../services/progresoService';
import { listarPreguntasRequest, responderPreguntaRequest } from '../services/preguntaService';
import { emitirCertificadoRequest } from '../services/certificadoService';
import { obtenerUrlArchivoRequest } from '../services/contenidoService';
import { SkeletonAprender } from '../components/Skeleton';
import PreguntasClase from '../components/PreguntasClase';
import ReproductorClase from '../components/ReproductorClase';
import { videoConSeguimiento } from '../utils/videoSeguimiento';
import { htmlSeguro } from '../utils/htmlSeguro';

const ICONOS_TIPO = {
  video: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  lectura: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="6" x2="16" y2="6" strokeLinecap="round" />
      <line x1="8" y1="10" x2="16" y2="10" strokeLinecap="round" />
      <line x1="8" y1="14" x2="12" y2="14" strokeLinecap="round" />
    </svg>
  ),
  quiz: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function IconoCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoDescargar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconoArchivo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconoSol() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconoLuna() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

// "Módulo 1: Preparar la mezcla". Si el título cargado ya empieza con
// "Módulo 1:" (o "Modulo 1 -"), no se repite.
function tituloModulo(numero, titulo = '') {
  const limpio = titulo.replace(/^\s*m[oó]dulo\s*\d+\s*[:.\-–]?\s*/i, '');
  return `Módulo ${numero}: ${limpio || titulo}`;
}

// El texto de una clase se muestra como HTML si tiene etiquetas o entidades
// (por ejemplo "&nbsp;" que deja el editor de texto enriquecido).
// Notas vacías (o solo etiquetas sin texto): la sección no se muestra
function tieneTexto(texto = '') {
  return Boolean((texto || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
}

function esHtml(texto = '') {
  return /<\/?[a-z][\s\S]*>|&[a-z]+;|&#\d+;/i.test(texto);
}

function CursoAprender() {
  const { id } = useParams();
  const location = useLocation();
  // "Ver como alumno" desde el editor: el Volver regresa al editor (solo rutas del panel)
  const volverPedido = new URLSearchParams(location.search).get('volver') || '';
  const volverA = /^\/(admin|panel-instructor)\//.test(volverPedido) ? volverPedido : `/cursos/${id}`;

  const [curso, setCurso] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [contenidoActual, setContenidoActual] = useState(null);
  const [moduloExpandido, setModuloExpandido] = useState(null);
  const [selectorModuloAbierto, setSelectorModuloAbierto] = useState(false);
  const [tabActiva, setTabActiva] = useState('preguntas'); // 'preguntas' | 'recursos'
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [generandoCertificado, setGenerandoCertificado] = useState(false);
  const [mostrarFinalizacion, setMostrarFinalizacion] = useState(false);
  // Clases que faltan completar al tocar "Finalizar curso" (por ejemplo, videos sin ver)
  const [clasesPendientes, setClasesPendientes] = useState([]);
  const [certificadoAbierto, setCertificadoAbierto] = useState(false);
  // Panel izquierdo desplegable: se recuerda abierto o cerrado en este navegador
  const [panelAbierto, setPanelAbierto] = useState(() => {
    try {
      return localStorage.getItem('aprender-panel') !== 'cerrado';
    } catch {
      return true;
    }
  });
  function alternarPanel() {
    setPanelAbierto((prev) => {
      const siguiente = !prev;
      try {
        localStorage.setItem('aprender-panel', siguiente ? 'abierto' : 'cerrado');
      } catch {
        // si el storage no está disponible, no pasa nada
      }
      return siguiente;
    });
  }
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem('aprender-tema') || 'oscuro';
    } catch {
      return 'oscuro';
    }
  });

  // Una clase de tipo "bloques" puede tener varios bloques de quiz, así que estos
  // tres viven "arriba" indexados por bloque (no por clase), así no se pierden al navegar.
  const [preguntasPorBloque, setPreguntasPorBloque] = useState({});
  const [respuestasPorBloque, setRespuestasPorBloque] = useState({});
  const [opcionesPorBloque, setOpcionesPorBloque] = useState({});

  useEffect(() => {
    cargarDatos();
  }, [id]);

  useEffect(() => {
    setTabActiva('preguntas');
    setMostrarFinalizacion(false);
  }, [contenidoActual?.id]);

  function alternarTema() {
    setTema((prev) => {
      const siguiente = prev === 'oscuro' ? 'claro' : 'oscuro';
      try {
        localStorage.setItem('aprender-tema', siguiente);
      } catch {
        // si el storage no está disponible, no pasa nada
      }
      return siguiente;
    });
  }

  function obtenerTodosLosContenidos(cursoData) {
    const modulosOrdenados = [...cursoData.modulos].sort((a, b) => a.orden - b.orden);
    return modulosOrdenados.flatMap((modulo) =>
      [...modulo.contenidos]
        .sort((a, b) => a.orden - b.orden)
        .map((c) => ({ ...c, idModulo: modulo.id }))
    );
  }

  async function cargarDatos() {
    try {
      const dataCurso = await obtenerCursoRequest(id);
      const dataProgreso = await obtenerProgresoCursoRequest(id);

      setCurso(dataCurso);
      setProgreso(dataProgreso);

      const todosLosContenidos = obtenerTodosLosContenidos(dataCurso);
      // Se puede abrir una clase puntual: desde otra pantalla (state) o desde
      // un link de mail (?clase=ID, ej: "Respondieron tu pregunta")
      const claseUrl = parseInt(new URLSearchParams(location.search).get('clase'), 10);
      const idSolicitado = location.state?.contenidoId || claseUrl;
      const contenidoSolicitado = idSolicitado
        ? todosLosContenidos.find((c) => c.id === idSolicitado)
        : null;
      const primerPendiente = todosLosContenidos.find(
        (c) => !dataProgreso.contenidosCompletados.includes(c.id)
      );
      const inicial = contenidoSolicitado || primerPendiente || todosLosContenidos[0];
      irAContenido(inicial, todosLosContenidos, dataProgreso);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el curso. ¿Estás inscripto?');
    } finally {
      setCargando(false);
    }
  }

  // Los bloques de quiz de una clase de tipo "bloques" (puede haber ninguno, uno o varios).
  function bloquesQuizDe(contenido) {
    return contenido.tipo === 'bloques' ? (contenido.bloques || []).filter((b) => b.tipo === 'quiz') : [];
  }

  // progresoActual: al abrir el curso, el estado "progreso" todavía no se actualizó
  // (se acaba de pedir), así que se pasa el recién cargado.
  function irAContenido(contenido, _todos, progresoActual = progreso) {
    if (!contenido) return;
    // Cierra el cartel de "Te falta…" / finalización aunque sea la misma clase
    setMostrarFinalizacion(false);
    setContenidoActual(contenido);
    setModuloExpandido(contenido.idModulo);
    setSelectorModuloAbierto(false);

    bloquesQuizDe(contenido).forEach((bloque) => {
      if (!preguntasPorBloque[bloque.id]) {
        cargarPreguntasBloque(bloque.id, contenido, progresoActual);
      }
    });
  }

  async function cargarPreguntasBloque(bloqueId, contenido, progresoActual = progreso) {
    try {
      const data = await listarPreguntasRequest(bloqueId);
      setPreguntasPorBloque((prev) => ({ ...prev, [bloqueId]: data }));

      // El backend devuelve, junto a cada pregunta ya respondida antes,
      // el campo "yaRespondida" con la opción elegida y el resultado.
      // Lo volcamos al estado para que el quiz aparezca ya resuelto en
      // vez de en blanco al volver a entrar a la clase.
      const respondidas = data.filter((p) => p.yaRespondida);
      if (respondidas.length > 0) {
        setRespuestasPorBloque((prev) => ({
          ...prev,
          [bloqueId]: {
            ...(prev[bloqueId] || {}),
            ...Object.fromEntries(respondidas.map((p) => [p.id, p.yaRespondida])),
          },
        }));
        setOpcionesPorBloque((prev) => ({
          ...prev,
          [bloqueId]: {
            ...(prev[bloqueId] || {}),
            ...Object.fromEntries(respondidas.map((p) => [p.id, p.yaRespondida.opcionElegida])),
          },
        }));
      }

      // Un bloque de quiz sin preguntas (o uno donde ya se respondieron todas, por si
      // quedó sin marcar de una sesión anterior) no tiene nada pendiente de ese bloque.
      // Si además ningún otro bloque de quiz de esta clase queda pendiente, la clase
      // se da por completada para no dejar al alumno trabado sin poder avanzar ni
      // emitir el certificado.
      const todasRespondidasEnEsteBloque = data.length === respondidas.length;
      if (todasRespondidasEnEsteBloque) {
        verificarQuizDeClaseCompleto(contenido, { ...preguntasPorBloque, [bloqueId]: data }, { ...respuestasPorBloque, [bloqueId]: Object.fromEntries(respondidas.map((p) => [p.id, p.yaRespondida])) }, progresoActual);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar las preguntas del quiz');
    }
  }

  // Revisa si TODOS los bloques de quiz de una clase ya están totalmente respondidos
  // (usando los mapas de preguntas/respuestas más recientes que se le pasen) y, de ser
  // así, marca la clase como completada.
  function verificarQuizDeClaseCompleto(contenido, mapaPreguntas, mapaRespuestas, progresoActual = progreso) {
    const bloquesQuiz = bloquesQuizDe(contenido);
    if (bloquesQuiz.length === 0) return;
    const todosCompletos = bloquesQuiz.every((bloque) => {
      const preguntasDelBloque = mapaPreguntas[bloque.id];
      if (!preguntasDelBloque) return false;
      const respuestasDelBloque = mapaRespuestas[bloque.id] || {};
      return preguntasDelBloque.length === Object.keys(respuestasDelBloque).length;
    });
    if (todosCompletos && progresoActual && !progresoActual.contenidosCompletados.includes(contenido.id)) {
      completarContenido(contenido.id);
    }
  }

  // Marca un contenido como completado. Actualiza la barra de progreso al toque,
  // sin esperar la respuesta del servidor (así no hay demora visible al pasar de
  // clase o al responder un quiz), y dispara el pedido al backend en paralelo;
  // cuando responde, reemplaza el estado por el valor definitivo del servidor.
  function completarContenido(contenidoId) {
    setProgreso((prev) => {
      if (!prev || prev.contenidosCompletados.includes(contenidoId)) return prev;
      const contenidosCompletados = [...prev.contenidosCompletados, contenidoId];
      const total = todosLosContenidos.length;
      const porcentaje = total > 0 ? Math.min(100, Math.round((contenidosCompletados.length / total) * 100)) : 0;
      return { ...prev, contenidosCompletados, porcentaje, completado: porcentaje >= 100 };
    });

    return marcarProgresoRequest(contenidoId)
      .then((resumen) => setProgreso(resumen))
      .catch(() => {
        // Si falla, dejamos el avance optimista: se corrige solo la próxima vez
        // que se recargue el progreso (por ejemplo al reabrir el curso).
      });
  }

  // Las clases de video de YouTube o Bunny se completan solas al ver el
  // porcentaje mínimo (lo controla el backend), no al pasar a la siguiente.
  const seCompletaAlAvanzar = (contenido) => bloquesQuizDe(contenido).length === 0
    && !(contenido.tipo === 'video' && videoConSeguimiento(contenido.urlVideo));

  // El reproductor avisa qué tramos se vieron; la respuesta trae el progreso al día
  function reportarVideo(contenidoId, tramos, duracion) {
    marcarVideoVistoRequest(contenidoId, tramos, duracion)
      .then((resumen) => setProgreso(resumen))
      .catch(() => {});
  }

  function handleFinalizarCurso() {
    const completadas = new Set(progreso.contenidosCompletados);
    if (seCompletaAlAvanzar(contenidoActual) && !completadas.has(contenidoActual.id)) {
      completarContenido(contenidoActual.id);
      completadas.add(contenidoActual.id);
    }
    setClasesPendientes(todosLosContenidos.filter((c) => !completadas.has(c.id)));
    setMostrarFinalizacion(true);
  }

  async function handleResponder(bloqueId, pregunta) {
    const opcion = opcionesPorBloque[bloqueId]?.[pregunta.id];
    if (!opcion) return;

    try {
      const resultado = await responderPreguntaRequest(pregunta.id, opcion);

      const respuestasDeEsteBloque = {
        ...(respuestasPorBloque[bloqueId] || {}),
        [pregunta.id]: { opcionElegida: opcion, ...resultado },
      };
      setRespuestasPorBloque((prev) => ({ ...prev, [bloqueId]: respuestasDeEsteBloque }));

      const preguntasDeEsteBloque = preguntasPorBloque[bloqueId] || [];
      if (Object.keys(respuestasDeEsteBloque).length === preguntasDeEsteBloque.length) {
        verificarQuizDeClaseCompleto(
          contenidoActual,
          preguntasPorBloque,
          { ...respuestasPorBloque, [bloqueId]: respuestasDeEsteBloque }
        );
      }
    } catch (err) {
      alert('Error al enviar la respuesta');
    }
  }

  function seleccionarOpcion(bloqueId, preguntaId, letra) {
    setOpcionesPorBloque((prev) => ({
      ...prev,
      [bloqueId]: { ...(prev[bloqueId] || {}), [preguntaId]: letra },
    }));
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

  async function handleDescargarArchivo(archivoId) {
    const nuevaPestana = window.open('', '_blank');
    try {
      const { url } = await obtenerUrlArchivoRequest(archivoId);
      nuevaPestana.location.href = url;
    } catch (err) {
      nuevaPestana.close();
      alert(err.response?.data?.error || 'No se pudo abrir el archivo');
    }
  }

  if (cargando) return <SkeletonAprender />;
  if (error) return <div className="error-box" style={{ maxWidth: 480, margin: '60px auto' }}>{error}</div>;
  if (!curso || !progreso || !contenidoActual) return null;

  const modulosOrdenados = [...curso.modulos].sort((a, b) => a.orden - b.orden);
  const todosLosContenidos = obtenerTodosLosContenidos(curso);
  const indiceActual = todosLosContenidos.findIndex((c) => c.id === contenidoActual.id);
  const hayAnterior = indiceActual > 0;
  const haySiguiente = indiceActual < todosLosContenidos.length - 1;

  const bloquesDeLaClaseActual = contenidoActual.tipo === 'bloques'
    ? [...(contenidoActual.bloques || [])].sort((a, b) => a.orden - b.orden)
    : [];
  const bloquesQuizActuales = bloquesQuizDe(contenidoActual);

  const yaCompletado = progreso.contenidosCompletados.includes(contenidoActual.id);

  // Las clases sin quiz se van completando solas al avanzar a la siguiente: no
  // hace falta un botón de "aprobado/desaprobado", simplemente se registran como
  // vistas y se continúa. Las clases con uno o más bloques de quiz, en cambio, se
  // completan solas cuando se responden todas sus preguntas (ver verificarQuizDeClaseCompleto).
  function handleSiguiente() {
    const siguiente = todosLosContenidos[indiceActual + 1];

    if (seCompletaAlAvanzar(contenidoActual) && !yaCompletado) {
      completarContenido(contenidoActual.id);
    }

    if (siguiente) {
      irAContenido(siguiente);
    }
  }

  // Elegir un módulo en el selector abre su primera clase
  function elegirModulo(modulo) {
    setSelectorModuloAbierto(false);
    // Si es el módulo de la clase que está abierta, se queda en esa clase
    if (modulo.id === moduloDeLaClaseAbierta()) {
      setModuloExpandido(modulo.id);
      return;
    }
    const primera = [...modulo.contenidos].sort((a, b) => a.orden - b.orden)[0];
    if (primera) irAContenido({ ...primera, idModulo: modulo.id });
    else setModuloExpandido(modulo.id);
  }
  function moduloDeLaClaseAbierta() {
    return modulosOrdenados.find((m) => m.contenidos.some((c) => c.id === contenidoActual.id))?.id;
  }

  const moduloActual = modulosOrdenados.find((m) => m.id === moduloExpandido) || modulosOrdenados[0];
  const contenidosDelModulo = [...moduloActual.contenidos].sort((a, b) => a.orden - b.orden);
  const numeroModuloActual = modulosOrdenados.findIndex((m) => m.id === moduloActual.id) + 1;
  const completadasDelModulo = contenidosDelModulo.filter((c) => progreso.contenidosCompletados.includes(c.id)).length;

  // El título de arriba (módulo y número de lección) es siempre el de la clase
  // abierta, aunque en el panel se esté mirando otro módulo
  const moduloDeLaClase = modulosOrdenados.find((m) => m.contenidos.some((c) => c.id === contenidoActual.id)) || moduloActual;
  const numeroModuloDeLaClase = modulosOrdenados.findIndex((m) => m.id === moduloDeLaClase.id) + 1;
  const contenidosDeLaClase = [...moduloDeLaClase.contenidos].sort((a, b) => a.orden - b.orden);
  const numeroLeccion = contenidosDeLaClase.findIndex((c) => c.id === contenidoActual.id) + 1;

  // Botones Anterior / Siguiente: van abajo del panel izquierdo; si el panel
  // está cerrado, se muestran flotando abajo del contenido.
  const renderNavegacion = (flotante) => (
    <div className={`aprender-nav-inferior ${flotante ? 'aprender-nav-flotante' : ''}`}>
      <button
        type="button"
        className="aprender-nav-anterior"
        onClick={() => irAContenido(todosLosContenidos[indiceActual - 1])}
        disabled={!hayAnterior}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Anterior</span>
      </button>
      <button
        type="button"
        className="aprender-nav-siguiente"
        onClick={haySiguiente ? handleSiguiente : handleFinalizarCurso}
        disabled={!haySiguiente && bloquesQuizActuales.length > 0 && !yaCompletado}
      >
        <span>{haySiguiente ? 'Siguiente' : 'Finalizar curso'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
  const navegacion = renderNavegacion(false);

  // Panel de la derecha (Preguntas / Archivos): va al costado del video o, en las
  // clases sin video, al costado del contenido.
  const panelLateral = contenidoActual ? (
    <aside className="aprender-video-lateral">
      <div className="aprender-video-lateral-interno">
        <div className="aprender-tabs">
          <button
            type="button"
            className={`aprender-tab ${tabActiva === 'preguntas' ? 'activa' : ''}`}
            onClick={() => setTabActiva('preguntas')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Preguntas</span>
          </button>
          <button
            type="button"
            className={`aprender-tab ${tabActiva === 'recursos' ? 'activa' : ''}`}
            onClick={() => setTabActiva('recursos')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Archivos</span>
            {(contenidoActual.archivos || []).length > 0 && (
              <span className="aprender-tab-cantidad">{contenidoActual.archivos.length}</span>
            )}
          </button>
        </div>

        <div className="aprender-video-lateral-panel">
          {tabActiva === 'preguntas' && <PreguntasClase idContenido={contenidoActual.id} />}

          {tabActiva === 'recursos' && (
            (contenidoActual.archivos || []).length > 0 ? (
              <ul className="aprender-archivos">
                {contenidoActual.archivos.map((archivo) => (
                  <li key={archivo.id}>
                    <button
                      type="button"
                      className="aprender-archivo"
                      onClick={() => (String(archivo.id).startsWith('legacy-')
                        ? window.open(archivo.url, '_blank', 'noopener')
                        : handleDescargarArchivo(archivo.id))}
                    >
                      <span className="aprender-archivo-icono"><IconoArchivo /></span>
                      <span className="aprender-archivo-nombre">{archivo.nombre}</span>
                      <span className="aprender-archivo-descargar"><IconoDescargar /></span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="aprender-vacio-box">
                <span className="aprender-vacio-icono"><IconoArchivo /></span>
                <p className="aprender-vacio-titulo">Esta clase no tiene archivos.</p>
              </div>
            )
          )}
        </div>
      </div>
    </aside>
  ) : null;

  return (
    <div className={`aprender-page ${tema === 'claro' ? 'aprender-tema-claro' : ''}`}>
      <div className="aprender-subheader">
        <div className="aprender-subheader-inner">
          <Link to={volverA} className="aprender-volver">← Volver</Link>
          {progreso.esVistaPrevia && (
            <span className="aprender-vista-previa-pill" title="El progreso que marques acá no se cuenta como una venta ni como un alumno real">
              Vista previa — así lo vería un alumno
            </span>
          )}
          <button
            type="button"
            className="aprender-tema-btn"
            onClick={alternarTema}
            aria-label={tema === 'oscuro' ? 'Cambiar a pantalla clara' : 'Cambiar a pantalla oscura'}
            title={tema === 'oscuro' ? 'Pantalla clara' : 'Pantalla oscura'}
          >
            {tema === 'oscuro' ? <IconoSol /> : <IconoLuna />}
          </button>
        </div>
      </div>

      <div className={`aprender-layout ${panelAbierto ? '' : 'panel-cerrado'}`}>

        {/* Con el panel oculto, una solapa en el borde izquierdo lo vuelve a mostrar */}
        {!panelAbierto && (
          <button
            type="button"
            className="aprender-panel-solapa"
            onClick={alternarPanel}
            aria-expanded={false}
            aria-controls="aprender-panel-izq"
            aria-label="Mostrar el panel de clases"
            title="Mostrar el panel de clases"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        )}

        {/* Sidebar izquierda: progreso + navegación de módulos, todo dentro de un único panel.
            Se oculta con el ícono que está al lado del título del curso. */}
        <aside className="aprender-sidebar-izq" id="aprender-panel-izq" inert={!panelAbierto}>
          <div className="aprender-sidebar-scroll">
            <div className="aprender-sidebar-ruta">
              <div className="aprender-sidebar-ruta-fila">
                <h2 className="aprender-sidebar-ruta-titulo">{curso.titulo}</h2>
                <button
                  type="button"
                  className="aprender-panel-ocultar"
                  onClick={alternarPanel}
                  aria-expanded={panelAbierto}
                  aria-controls="aprender-panel-izq"
                  aria-label="Ocultar el panel"
                  title="Ocultar el panel"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="3" />
                    <path d="M9 4v16" />
                    <path d="M15.5 10l-2 2 2 2" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="aprender-progreso-card">
              {(() => {
                // El desplegable solo se habilita al terminar el curso (y si el curso emite certificado).
                const puedeVerCertificado = progreso.completado && curso.emiteCertificado !== false;
                return (
                  <>
                    {/* Mientras el curso no está terminado es solo informativo (sin
                        flechita ni clic); al terminarlo se vuelve un desplegable con el certificado. */}
                    {(() => {
                      const Etiqueta = puedeVerCertificado ? 'button' : 'div';
                      const propsDesplegable = puedeVerCertificado
                        ? {
                          type: 'button',
                          onClick: () => setCertificadoAbierto((v) => !v),
                          'aria-expanded': certificadoAbierto,
                          title: 'Ver tu certificado',
                        }
                        : {};
                      return (
                        <Etiqueta
                          className={`aprender-progreso-toggle ${puedeVerCertificado ? 'desplegable' : ''} ${certificadoAbierto && puedeVerCertificado ? 'abierto' : ''}`}
                          {...propsDesplegable}
                        >
                          <span className="aprender-progreso-fila">
                            <span className="aprender-progreso-label">Progreso del curso</span>
                            <span className="aprender-progreso-valores">
                              <span className="aprender-progreso-pct">{progreso.porcentaje}%</span>
                              {puedeVerCertificado && (
                                <svg
                                  className="aprender-progreso-chevron"
                                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              )}
                            </span>
                          </span>
                          <span className="aprender-progreso-track">
                            <span className="aprender-progreso-fill" style={{ width: `${progreso.porcentaje}%` }} />
                          </span>
                        </Etiqueta>
                      );
                    })()}

                    {puedeVerCertificado && certificadoAbierto && (
                      <button
                        onClick={handleVerCertificado}
                        disabled={generandoCertificado}
                        className="aprender-certificado-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665-6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{generandoCertificado ? 'Generando...' : 'Ver certificado'}</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="aprender-sidebar-seccion">
              <div className="aprender-modulo-label-fila">
                <span className="aprender-modulo-label">Módulo actual</span>
                <span className="aprender-modulo-estado">En curso</span>
              </div>
              <div className="aprender-modulo-selector">
                <button
                  type="button"
                  className="aprender-modulo-boton"
                  onClick={() => setSelectorModuloAbierto((v) => !v)}
                >
                  {/* key: al cambiar de módulo se vuelve a montar y corre la animación */}
                  <span key={`mod-${moduloActual.id}`} className="aprender-modulo-boton-info aprender-transicion-lateral">
                    <span className="aprender-modulo-numero">{String(numeroModuloActual).padStart(2, '0')}</span>
                    <span className="aprender-modulo-boton-texto">
                      {tituloModulo(numeroModuloActual, moduloActual.titulo)}
                      <span className="aprender-modulo-boton-meta">
                        {completadasDelModulo} de {contenidosDelModulo.length} {contenidosDelModulo.length === 1 ? 'clase completada' : 'clases completadas'}
                      </span>
                    </span>
                  </span>
                  <svg
                    className={`aprender-modulo-chevron ${selectorModuloAbierto ? 'abierto' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {selectorModuloAbierto && (
                  <div className="aprender-modulo-dropdown">
                    {modulosOrdenados.map((modulo, i) => (
                      <button
                        key={modulo.id}
                        type="button"
                        className={`aprender-modulo-dropdown-item ${modulo.id === moduloActual.id ? 'activo' : ''}`}
                        onClick={() => elegirModulo(modulo)}
                      >
                        {tituloModulo(i + 1, modulo.titulo)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="aprender-clases-cabecera">
                <span className="aprender-clases-label">Clases del módulo</span>
                <span className="aprender-clases-cantidad">
                  {contenidosDelModulo.length} {contenidosDelModulo.length === 1 ? 'lección' : 'lecciones'}
                </span>
              </div>
              <div key={`clases-${moduloActual.id}`} className="aprender-clases-lista aprender-transicion-lateral aprender-transicion--demora">
                {contenidosDelModulo.map((contenido) => {
                  const completada = progreso.contenidosCompletados.includes(contenido.id);
                  const activa = contenidoActual.id === contenido.id;

                  return (
                    <button
                      key={contenido.id}
                      type="button"
                      className={`aprender-clase-item ${activa ? 'activa' : ''} ${completada ? 'completada' : ''}`}
                      title={contenido.titulo}
                      onClick={() => irAContenido({ ...contenido, idModulo: moduloActual.id })}
                    >
                      <span className="aprender-clase-icono">{ICONOS_TIPO[contenido.tipo] || ICONOS_TIPO.lectura}</span>
                      <span className="aprender-clase-info">
                        <span className="aprender-clase-titulo">{numeroLeccionDe(contenidosDelModulo, contenido)}. {contenido.titulo}</span>
                      </span>
                      {!completada && progreso.videosVistos?.[contenido.id] > 0 ? (
                        <span className="aprender-clase-visto" title="Visto del video">{progreso.videosVistos[contenido.id]}%</span>
                      ) : (
                        <span className={`aprender-clase-check ${completada ? 'completado' : ''}`}>
                          <IconoCheck />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {navegacion}
        </aside>

        {/* Contenido central: scrollea de forma independiente del panel izquierdo */}
        <div className="aprender-main-scroll">
          {mostrarFinalizacion && clasesPendientes.length > 0 ? (
            <div className="aprender-contenido-scroll">
            <div className="aprender-finalizacion">
              <h1 className="aprender-finalizacion-titulo">
                {clasesPendientes.length === 1 ? 'Te falta 1 clase' : `Te faltan ${clasesPendientes.length} clases`}
              </h1>
              <div className="aprender-finalizacion-acciones">
                <button
                  type="button"
                  className="aprender-finalizacion-btn"
                  onClick={() => irAContenido(clasesPendientes[0])}
                >
                  Ir a {clasesPendientes[0].titulo}
                </button>
                <button
                  type="button"
                  className="aprender-finalizacion-volver"
                  onClick={() => setMostrarFinalizacion(false)}
                >
                  Volver a la clase
                </button>
              </div>
            </div>
            </div>
          ) : mostrarFinalizacion ? (
            <div className="aprender-contenido-scroll">
            <div className="aprender-finalizacion">
              <div className="aprender-finalizacion-icono" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="9" r="5.5" />
                  <path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" />
                  <path d="M10 9l1.5 1.5L14.5 7.5" />
                </svg>
              </div>
              <h1 className="aprender-finalizacion-titulo">¡Felicidades, finalizaste el curso!</h1>
              <p className="aprender-finalizacion-texto">
                Completaste todas las clases de "{curso.titulo}".
                {curso.emiteCertificado !== false
                  ? ' Ya podés emitir tu certificado.'
                  : ''}
              </p>
              <div className="aprender-finalizacion-acciones">
                {curso.emiteCertificado !== false ? (
                  <button
                    onClick={handleVerCertificado}
                    disabled={generandoCertificado}
                    className="aprender-finalizacion-btn"
                  >
                    {generandoCertificado ? 'Generando...' : 'Finalizar y emitir certificado'}
                  </button>
                ) : (
                  <Link to={`/cursos/${id}`} className="aprender-finalizacion-btn">
                    Volver al curso
                  </Link>
                )}
                <button
                  type="button"
                  className="aprender-finalizacion-volver"
                  onClick={() => setMostrarFinalizacion(false)}
                >
                  Volver a la clase
                </button>
              </div>
            </div>
            </div>
          ) : (
            <>
              {/* key: al cambiar de clase se vuelven a montar y corre la animación de entrada */}
              <div key={`cab-${contenidoActual.id}`} className="aprender-cabecera-clase aprender-transicion">
                <p className="aprender-breadcrumb">
                  <span className="aprender-breadcrumb-modulo">{tituloModulo(numeroModuloDeLaClase, moduloDeLaClase.titulo)}</span>
                  <span className="aprender-breadcrumb-sep">/</span>
                  <span>Lección {numeroLeccion} de {contenidosDeLaClase.length}</span>
                </p>
                <h1 className="aprender-titulo-clase">{contenidoActual.titulo}</h1>
              </div>

              <div key={`cont-${contenidoActual.id}`} className="aprender-contenido-scroll aprender-transicion aprender-transicion--demora">

              {contenidoActual.tipo === 'video' && (
                <>
                  {/* Video a la izquierda y, a la derecha, transcripción y archivos */}
                  <div className="aprender-video-fila">
                    <div className="aprender-video-card">
                      <div className="aprender-video-frame">
                        {contenidoActual.urlVideo ? (
                          <ReproductorClase
                            url={contenidoActual.urlVideo}
                            titulo={contenidoActual.titulo}
                            seguir={!yaCompletado}
                            onAvance={(tramos, duracion) => reportarVideo(contenidoActual.id, tramos, duracion)}
                          />
                        ) : (
                          <div className="aprender-video-vacio">Esta clase todavía no tiene video.</div>
                        )}
                      </div>
                    </div>

                    {panelLateral}
                  </div>

                  {/* Notas de la lección, abajo a todo el ancho (si la clase no tiene, no se muestra) */}
                  {tieneTexto(contenidoActual.contenidoTexto) && (
                  <section className="aprender-notas-seccion">
                    <h2 className="aprender-notas-titulo">Notas de la lección</h2>
                    <div className="aprender-tab-panel">
                      <div className="aprender-notas-scroll">
                        {esHtml(contenidoActual.contenidoTexto) ? (
                          <div
                            className="aprender-notas aprender-notas-enriquecidas"
                            dangerouslySetInnerHTML={{ __html: htmlSeguro(contenidoActual.contenidoTexto) }}
                          />
                        ) : (
                          <div className="aprender-notas">
                            {contenidoActual.contenidoTexto.split(/\n{2,}/).map((parrafo, i) => (
                              <p key={i}>{parrafo}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                  )}
                </>
              )}

              {contenidoActual.tipo !== 'video' && (
                <div className="aprender-video-fila aprender-fila-bloques">
                <div className="aprender-bloques">
                  {bloquesDeLaClaseActual.length === 0 && (
                    <div className="aprender-vacio-box">
                      <span className="aprender-vacio-icono"><IconoArchivo /></span>
                      <p className="aprender-vacio-titulo">Esta clase no tiene contenido.</p>
                    </div>
                  )}
                  {bloquesDeLaClaseActual.map((bloque) => (
                    bloque.tipo === 'texto' ? (
                      <div key={bloque.id} className="aprender-bloque-texto">
                        {bloque.contenidoTexto ? (
                          esHtml(bloque.contenidoTexto) ? (
                            <div
                              className="aprender-notas aprender-notas-enriquecidas"
                              dangerouslySetInnerHTML={{ __html: htmlSeguro(bloque.contenidoTexto) }}
                            />
                          ) : (
                            <div className="aprender-notas">
                              {bloque.contenidoTexto.split(/\n{2,}/).map((parrafo, i) => (
                                <p key={i}>{parrafo}</p>
                              ))}
                            </div>
                          )
                        ) : null}
                      </div>
                    ) : (
                      <div key={bloque.id} className="aprender-tab-panel aprender-quiz">
                        {(preguntasPorBloque[bloque.id] || []).length === 0 && (
                          <div className="aprender-vacio-box">
                            <span className="aprender-vacio-icono"><IconoArchivo /></span>
                            <p className="aprender-vacio-titulo">Esta evaluación no tiene preguntas.</p>
                          </div>
                        )}
                        {(preguntasPorBloque[bloque.id] || []).map((pregunta) => {
                          const respuestasDelBloque = respuestasPorBloque[bloque.id] || {};
                          const opcionesDelBloque = opcionesPorBloque[bloque.id] || {};
                          const yaRespondida = respuestasDelBloque[pregunta.id];
                          return (
                            <div key={pregunta.id} className="aprender-quiz-pregunta">
                              <p className="aprender-quiz-enunciado">{pregunta.enunciado}</p>

                              <div className="aprender-quiz-opciones">
                                {['A', 'B', 'C', 'D'].filter((letra) => pregunta[`opcion${letra}`]).map((letra) => {
                                  const seleccionada = opcionesDelBloque[pregunta.id] === letra;
                                  return (
                                    <button
                                      key={letra}
                                      type="button"
                                      disabled={Boolean(yaRespondida)}
                                      onClick={() => seleccionarOpcion(bloque.id, pregunta.id, letra)}
                                      className={`aprender-quiz-opcion ${seleccionada ? 'seleccionada' : ''}`}
                                    >
                                      <span className="aprender-quiz-opcion-letra">{letra}</span>
                                      {pregunta[`opcion${letra}`]}
                                    </button>
                                  );
                                })}
                              </div>

                              {!yaRespondida && (
                                <button
                                  onClick={() => handleResponder(bloque.id, pregunta)}
                                  disabled={!opcionesDelBloque[pregunta.id]}
                                  className="aprender-quiz-responder-btn"
                                >
                                  Responder
                                </button>
                              )}

                              {yaRespondida && (
                                <p className={`aprender-quiz-resultado ${yaRespondida.correcta ? 'correcto' : 'incorrecto'}`}>
                                  <span className="aprender-quiz-resultado-linea">
                                    {yaRespondida.correcta ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                                    )}
                                    {yaRespondida.correcta ? '¡Correcto!' : `Incorrecto. La respuesta correcta era ${yaRespondida.respuestaCorrecta}.`}
                                  </span>
                                  {yaRespondida.explicacion && <><br /><em>{yaRespondida.explicacion}</em></>}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  ))}
                </div>
                {panelLateral}
                </div>
              )}
              </div>
            </>
          )}
          {!panelAbierto && renderNavegacion(true)}
        </div>
      </div>
    </div>
  );
}

function numeroLeccionDe(contenidos, contenido) {
  return contenidos.findIndex((c) => c.id === contenido.id) + 1;
}

export default CursoAprender;

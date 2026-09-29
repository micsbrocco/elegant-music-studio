import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerCursoRequest } from '../services/cursoService';
import { marcarProgresoRequest, obtenerProgresoCursoRequest } from '../services/progresoService';
import { listarPreguntasRequest, responderPreguntaRequest } from '../services/preguntaService';
import { emitirCertificadoRequest } from '../services/certificadoService';

function CursoAprender() {
  const { id } = useParams();

  const [curso, setCurso] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [contenidoActual, setContenidoActual] = useState(null);
  const [moduloExpandido, setModuloExpandido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [generandoCertificado, setGenerandoCertificado] = useState(false);

  // Estos dos viven "arriba" y quedan indexados por contenido, así no se pierden al navegar
  const [preguntasPorContenido, setPreguntasPorContenido] = useState({});
  const [respuestasPorContenido, setRespuestasPorContenido] = useState({});
  const [opcionesPorContenido, setOpcionesPorContenido] = useState({});

  useEffect(() => {
    cargarDatos();
  }, [id]);

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
      const primerPendiente = todosLosContenidos.find(
        (c) => !dataProgreso.contenidosCompletados.includes(c.id)
      );
      const inicial = primerPendiente || todosLosContenidos[0];
      irAContenido(inicial, todosLosContenidos);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el curso. ¿Estás inscripto?');
    } finally {
      setCargando(false);
    }
  }

  function irAContenido(contenido, listaContenidos) {
    if (!contenido) return;
    setContenidoActual(contenido);
    setModuloExpandido(contenido.idModulo);

    if (contenido.tipo === 'quiz' && !preguntasPorContenido[contenido.id]) {
      cargarPreguntas(contenido.id);
    }
  }

  async function cargarPreguntas(contenidoId) {
    try {
      const data = await listarPreguntasRequest(contenidoId);
      setPreguntasPorContenido((prev) => ({ ...prev, [contenidoId]: data }));
    } catch (err) {
      setError('Error al cargar las preguntas del quiz');
    }
  }

  async function refrescarProgreso() {
    const dataProgreso = await obtenerProgresoCursoRequest(id);
    setProgreso(dataProgreso);
  }

  async function handleMarcarCompletado() {
    try {
      await marcarProgresoRequest(contenidoActual.id);
      await refrescarProgreso();
    } catch (err) {
      alert('Error al marcar el contenido como completado');
    }
  }

  async function handleResponder(pregunta) {
    const opcion = opcionesPorContenido[contenidoActual.id]?.[pregunta.id];
    if (!opcion) return;

    try {
      const resultado = await responderPreguntaRequest(pregunta.id, opcion);

      setRespuestasPorContenido((prev) => {
        const respuestasDeEsteContenido = {
          ...(prev[contenidoActual.id] || {}),
          [pregunta.id]: { opcionElegida: opcion, ...resultado },
        };
        const actualizado = { ...prev, [contenidoActual.id]: respuestasDeEsteContenido };

        // Si ya respondió todas las preguntas de este contenido, marcamos el progreso
        const preguntasDeEsteContenido = preguntasPorContenido[contenidoActual.id] || [];
        if (Object.keys(respuestasDeEsteContenido).length === preguntasDeEsteContenido.length) {
          marcarProgresoRequest(contenidoActual.id).then(refrescarProgreso);
        }

        return actualizado;
      });
    } catch (err) {
      alert('Error al enviar la respuesta');
    }
  }


  function seleccionarOpcion(preguntaId, letra) {
    setOpcionesPorContenido((prev) => ({
      ...prev,
      [contenidoActual.id]: { ...(prev[contenidoActual.id] || {}), [preguntaId]: letra },
    }));
  }


  if (cargando) return <p>Cargando curso...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!curso || !progreso || !contenidoActual) return null;

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

  const modulosOrdenados = [...curso.modulos].sort((a, b) => a.orden - b.orden);
  const todosLosContenidos = obtenerTodosLosContenidos(curso);
  const indiceActual = todosLosContenidos.findIndex((c) => c.id === contenidoActual.id);
  const hayAnterior = indiceActual > 0;
  const haySiguiente = indiceActual < todosLosContenidos.length - 1;

  const preguntas = preguntasPorContenido[contenidoActual.id] || [];
  const respuestas = respuestasPorContenido[contenidoActual.id] || {};
  const opcionesSeleccionadas = opcionesPorContenido[contenidoActual.id] || {};

  const yaCompletado = progreso.contenidosCompletados.includes(contenidoActual.id);

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <Link to={`/cursos/${id}`}>← Volver al curso</Link>
        <h3>{curso.titulo}</h3>

        <div style={{ background: '#eee', borderRadius: '4px', height: '10px', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: `${progreso.porcentaje}%`,
              background: '#4caf50',
              height: '10px',
              borderRadius: '4px',
            }}
          />
        </div>
        <p>{progreso.porcentaje}% completado</p>
        {progreso.completado && <p>🎉 ¡Curso completado!</p>}
        {progreso.completado && (
        <button onClick={handleVerCertificado} disabled={generandoCertificado} style={{ width: '100%', marginBottom: '1rem' }}>
            {generandoCertificado ? 'Generando...' : '🎓 Ver certificado'}
        </button>
        )}

        {/* Navegación + marcar completado, todo junto */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => irAContenido(todosLosContenidos[indiceActual - 1], todosLosContenidos)}
            disabled={!hayAnterior}
          >
            ← Anterior
          </button>
          <button
            onClick={() => irAContenido(todosLosContenidos[indiceActual + 1], todosLosContenidos)}
            disabled={!haySiguiente}
          >
            Siguiente →
          </button>
        </div>

        {contenidoActual.tipo !== 'quiz' && (
          <button onClick={handleMarcarCompletado} disabled={yaCompletado} style={{ marginBottom: '1rem', width: '100%' }}>
            {yaCompletado ? '✅ Completado' : 'Marcar como completado'}
          </button>
        )}

        {/* Acordeón de módulos */}
        {modulosOrdenados.map((modulo) => {
          const expandido = moduloExpandido === modulo.id;
          return (
            <div key={modulo.id} style={{ marginBottom: '0.5rem' }}>
              <div
                onClick={() => setModuloExpandido(expandido ? null : modulo.id)}
                style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0.3rem 0' }}
              >
                {expandido ? '▾' : '▸'} {modulo.titulo}
              </div>

              {expandido && (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.25rem' }}>
                  {[...modulo.contenidos]
                    .sort((a, b) => a.orden - b.orden)
                    .map((contenido) => {
                      const completado = progreso.contenidosCompletados.includes(contenido.id);
                      const activo = contenidoActual.id === contenido.id;
                      return (
                        <li
                          key={contenido.id}
                          onClick={() => irAContenido({ ...contenido, idModulo: modulo.id }, todosLosContenidos)}
                          style={{
                            cursor: 'pointer',
                            padding: '0.4rem 0.5rem',
                            background: activo ? '#f0f0f0' : 'transparent',
                            color: completado ? 'green' : 'inherit',
                            fontWeight: activo ? 'bold' : 'normal',
                          }}
                        >
                          {completado ? '✅' : '⬜'} [{contenido.tipo}] {contenido.titulo}
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <h2>{contenidoActual.titulo}</h2>

        {contenidoActual.tipo === 'video' && (
          <iframe
            width="100%"
            height="400"
            src={contenidoActual.urlVideo}
            title={contenidoActual.titulo}
            allowFullScreen
          />
        )}

        {contenidoActual.tipo === 'texto' && (
          <div>
            <p>{contenidoActual.contenidoTexto}</p>
            {contenidoActual.archivoDescargable && (
              <p>
                <a href={contenidoActual.archivoDescargable} target="_blank" rel="noreferrer">
                  Descargar material
                </a>
              </p>
            )}
          </div>
        )}

        {contenidoActual.tipo === 'quiz' && (
          <div>
            {preguntas.map((pregunta) => {
              const yaRespondida = respuestas[pregunta.id];
              return (
                <div key={pregunta.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                  <p><strong>{pregunta.enunciado}</strong></p>

                  {['A', 'B', 'C', 'D'].map((letra) => (
                    <div key={letra}>
                      <label>
                        <input
                          type="radio"
                          name={`pregunta-${pregunta.id}`}
                          disabled={Boolean(yaRespondida)}
                          checked={opcionesSeleccionadas[pregunta.id] === letra}
                          onChange={() => seleccionarOpcion(pregunta.id, letra)}
                        />
                        {' '}{letra}) {pregunta[`opcion${letra}`]}
                      </label>
                    </div>
                  ))}

                  {!yaRespondida && (
                    <button
                      onClick={() => handleResponder(pregunta)}
                      disabled={!opcionesSeleccionadas[pregunta.id]}
                    >
                      Responder
                    </button>
                  )}

                  {yaRespondida && (
                    <p style={{ color: yaRespondida.correcta ? 'green' : 'red' }}>
                      {yaRespondida.correcta ? '✅ ¡Correcto!' : `❌ Incorrecto. La respuesta correcta era ${yaRespondida.respuestaCorrecta}.`}
                      {yaRespondida.explicacion && <><br /><em>{yaRespondida.explicacion}</em></>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CursoAprender;
import { useEffect, useState } from 'react';
import { misConsultasDeClaseRequest, crearConsultaRequest } from '../services/consultaService';

function fechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// Preguntas privadas del alumno sobre la clase actual: solo las ve él y quienes
// dan el curso. Cuando le responden, le llega un mail.
function PreguntasClase({ idContenido }) {
  const [consultas, setConsultas] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setConsultas(null);
    setTexto('');
    setError('');
    misConsultasDeClaseRequest(idContenido).then(setConsultas).catch(() => setConsultas([]));
  }, [idContenido]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setError('');
    try {
      const nueva = await crearConsultaRequest(idContenido, texto.trim());
      setConsultas((lista) => [...(lista || []), nueva]);
      setTexto('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar tu pregunta');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="aprender-preguntas">
      {consultas === null ? (
        <p className="aprender-preguntas-nota">Cargando…</p>
      ) : consultas.length === 0 ? null : (
        <ul className="aprender-preguntas-lista">
          {consultas.map((c) => (
            <li key={c.id} className="aprender-pregunta">
              <p className="aprender-pregunta-texto">{c.texto}</p>
              <span className="aprender-pregunta-meta">Preguntaste el {fechaCorta(c.creadaEn)}</span>
              {c.respuesta ? (
                <div className={`aprender-pregunta-respuesta ${c.nueva ? 'nueva' : ''}`}>
                  {c.nueva && <span className="aprender-pregunta-nueva">Nueva respuesta</span>}
                  <span className="aprender-pregunta-quien">
                    {c.respondedor ? `${c.respondedor.nombre} ${c.respondedor.apellido}` : 'Respuesta'} · {fechaCorta(c.respondidaEn)}
                  </span>
                  <p>{c.respuesta}</p>
                </div>
              ) : (
                <span className="aprender-pregunta-espera">Esperando respuesta</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="aprender-preguntas-form" onSubmit={enviar}>
        <textarea
          aria-label="Tu pregunta"
          rows={3}
          maxLength={2000}
          placeholder="Escribí tu pregunta sobre esta clase…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <p className="aprender-preguntas-privada">Esta consulta es privada: solo la podrán ver los instructores de este curso.</p>
        {error && <p className="aprender-preguntas-error">{error}</p>}
        <button type="submit" className="aprender-preguntas-enviar" disabled={!texto.trim() || enviando}>
          {enviando ? 'Enviando…' : 'Enviar pregunta'}
        </button>
      </form>
    </div>
  );
}

export default PreguntasClase;

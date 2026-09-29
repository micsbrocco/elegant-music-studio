import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  listarPreguntasAdminRequest,
  crearPreguntaRequest,
  eliminarPreguntaRequest,
} from '../../services/preguntaService';

function AdminPreguntas() {
  const { contenidoId } = useParams();
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [enunciado, setEnunciado] = useState('');
  const [opcionA, setOpcionA] = useState('');
  const [opcionB, setOpcionB] = useState('');
  const [opcionC, setOpcionC] = useState('');
  const [opcionD, setOpcionD] = useState('');
  const [respuestaCorrecta, setRespuestaCorrecta] = useState('A');
  const [explicacionA, setExplicacionA] = useState('');
  const [explicacionB, setExplicacionB] = useState('');
  const [explicacionC, setExplicacionC] = useState('');
  const [explicacionD, setExplicacionD] = useState('');

  useEffect(() => {
    cargarPreguntas();
  }, [contenidoId]);

  async function cargarPreguntas() {
    try {
      const data = await listarPreguntasAdminRequest(contenidoId);
      setPreguntas(data);
    } catch (err) {
      setError('Error al cargar las preguntas');
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormulario() {
    setEnunciado('');
    setOpcionA('');
    setOpcionB('');
    setOpcionC('');
    setOpcionD('');
    setRespuestaCorrecta('A');
    setExplicacionA('');
    setExplicacionB('');
    setExplicacionC('');
    setExplicacionD('');
  }

  async function handleAgregarPregunta(e) {
    e.preventDefault();

    try {
      await crearPreguntaRequest(contenidoId, {
        enunciado,
        opcionA,
        opcionB,
        opcionC,
        opcionD,
        respuestaCorrecta,
        explicacionA: explicacionA || undefined,
        explicacionB: explicacionB || undefined,
        explicacionC: explicacionC || undefined,
        explicacionD: explicacionD || undefined,
      });
      limpiarFormulario();
      cargarPreguntas();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear la pregunta');
    }
  }

  async function handleEliminar(id) {
    const confirmar = window.confirm('¿Eliminar esta pregunta?');
    if (!confirmar) return;

    try {
      await eliminarPreguntaRequest(id);
      cargarPreguntas();
    } catch (err) {
      alert('Error al eliminar la pregunta');
    }
  }

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <Link to="/admin/cursos">← Volver a cursos</Link>
      <h2>Preguntas del quiz</h2>

      {preguntas.length === 0 ? (
        <p>Todavía no hay preguntas cargadas.</p>
      ) : (
        <ul>
          {preguntas.map((pregunta) => (
            <li key={pregunta.id} style={{ marginBottom: '1rem' }}>
              <strong>{pregunta.enunciado}</strong>
              <br />
              A) {pregunta.opcionA} {pregunta.respuestaCorrecta === 'A' && '✓'}
              {pregunta.explicacionA && <div><em>↳ {pregunta.explicacionA}</em></div>}
              B) {pregunta.opcionB} {pregunta.respuestaCorrecta === 'B' && '✓'}
              {pregunta.explicacionB && <div><em>↳ {pregunta.explicacionB}</em></div>}
              C) {pregunta.opcionC} {pregunta.respuestaCorrecta === 'C' && '✓'}
              {pregunta.explicacionC && <div><em>↳ {pregunta.explicacionC}</em></div>}
              D) {pregunta.opcionD} {pregunta.respuestaCorrecta === 'D' && '✓'}
              {pregunta.explicacionD && <div><em>↳ {pregunta.explicacionD}</em></div>}
              <br />
              <Link to={`/admin/preguntas/${pregunta.id}/editar`}>Editar</Link>
              {' '}
              <button onClick={() => handleEliminar(pregunta.id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}

      <h3>Agregar nueva pregunta</h3>
      <form onSubmit={handleAgregarPregunta}>
        <div>
          <label>Enunciado</label>
          <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} required />
        </div>

        <div>
          <label>Opción A</label>
          <input type="text" value={opcionA} onChange={(e) => setOpcionA(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación para esta opción (opcional)"
            value={explicacionA}
            onChange={(e) => setExplicacionA(e.target.value)}
          />
        </div>

        <div>
          <label>Opción B</label>
          <input type="text" value={opcionB} onChange={(e) => setOpcionB(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación para esta opción (opcional)"
            value={explicacionB}
            onChange={(e) => setExplicacionB(e.target.value)}
          />
        </div>

        <div>
          <label>Opción C</label>
          <input type="text" value={opcionC} onChange={(e) => setOpcionC(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación para esta opción (opcional)"
            value={explicacionC}
            onChange={(e) => setExplicacionC(e.target.value)}
          />
        </div>

        <div>
          <label>Opción D</label>
          <input type="text" value={opcionD} onChange={(e) => setOpcionD(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación para esta opción (opcional)"
            value={explicacionD}
            onChange={(e) => setExplicacionD(e.target.value)}
          />
        </div>

        <div>
          <label>Respuesta correcta</label>
          <select value={respuestaCorrecta} onChange={(e) => setRespuestaCorrecta(e.target.value)}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <button type="submit">Agregar pregunta</button>
      </form>
    </div>
  );
}

export default AdminPreguntas;
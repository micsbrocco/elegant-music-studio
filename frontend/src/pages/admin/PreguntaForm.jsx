import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { editarPreguntaRequest } from '../../services/preguntaService';

function PreguntaForm() {
  const { id } = useParams();
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
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    cargarPregunta();
  }, [id]);

  async function cargarPregunta() {
    try {
      // Como no armamos un GET de una sola pregunta, lo agregamos abajo en el backend.
      const response = await api.get(`/preguntas/${id}`);
      const pregunta = response.data;
      setEnunciado(pregunta.enunciado);
      setOpcionA(pregunta.opcionA);
      setOpcionB(pregunta.opcionB);
      setOpcionC(pregunta.opcionC);
      setOpcionD(pregunta.opcionD);
      setRespuestaCorrecta(pregunta.respuestaCorrecta);
      setExplicacionA(pregunta.explicacionA || '');
      setExplicacionB(pregunta.explicacionB || '');
      setExplicacionC(pregunta.explicacionC || '');
      setExplicacionD(pregunta.explicacionD || '');
    } catch (err) {
      setError('Error al cargar la pregunta');
    } finally {
      setCargandoDatos(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await editarPreguntaRequest(id, {
        enunciado,
        opcionA,
        opcionB,
        opcionC,
        opcionD,
        respuestaCorrecta,
        explicacionA: explicacionA || null,
        explicacionB: explicacionB || null,
        explicacionC: explicacionC || null,
        explicacionD: explicacionD || null,
      });
      navigate(-1); // vuelve a la pantalla anterior
    } catch (err) {
      setError(err.response?.data?.error || 'Error al editar la pregunta');
    }
  }

  if (cargandoDatos) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Editar pregunta</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Enunciado</label>
          <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} required />
        </div>

        <div>
          <label>Opción A</label>
          <input type="text" value={opcionA} onChange={(e) => setOpcionA(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación (opcional)"
            value={explicacionA}
            onChange={(e) => setExplicacionA(e.target.value)}
          />
        </div>

        <div>
          <label>Opción B</label>
          <input type="text" value={opcionB} onChange={(e) => setOpcionB(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación (opcional)"
            value={explicacionB}
            onChange={(e) => setExplicacionB(e.target.value)}
          />
        </div>

        <div>
          <label>Opción C</label>
          <input type="text" value={opcionC} onChange={(e) => setOpcionC(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación (opcional)"
            value={explicacionC}
            onChange={(e) => setExplicacionC(e.target.value)}
          />
        </div>

        <div>
          <label>Opción D</label>
          <input type="text" value={opcionD} onChange={(e) => setOpcionD(e.target.value)} required />
          <input
            type="text"
            placeholder="Explicación (opcional)"
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

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}

export default PreguntaForm;
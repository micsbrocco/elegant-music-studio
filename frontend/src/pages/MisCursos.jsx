import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { misCursosRequest } from '../services/inscripcionService';
import { emitirCertificadoRequest } from '../services/certificadoService';

function MisCursos() {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [generandoCertificado, setGenerandoCertificado] = useState(null);

  useEffect(() => {
    cargarMisCursos();
  }, []);

  async function cargarMisCursos() {
    try {
      const data = await misCursosRequest();
      setInscripciones(data);
    } catch (err) {
      setError('Error al cargar tus cursos');
    } finally {
      setCargando(false);
    }
  }

  async function handleVerCertificado(inscripcionId) {
  const nuevaPestana = window.open('', '_blank');
  setGenerandoCertificado(inscripcionId);
  try {
    const certificado = await emitirCertificadoRequest(inscripcionId);
    nuevaPestana.location.href = certificado.url;
  } catch (err) {
    nuevaPestana.close();
    alert(err.response?.data?.error || 'Error al generar el certificado');
  } finally {
    setGenerandoCertificado(null);
  }
}

  if (cargando) return <p>Cargando tus cursos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Mis cursos</h2>

      {inscripciones.length === 0 ? (
        <p>
          Todavía no compraste ningún curso. <Link to="/cursos">Ver catálogo</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {inscripciones.map((inscripcion) => (
            <div
              key={inscripcion.id}
              style={{ border: '1px solid #ccc', padding: '1rem', width: '250px' }}
            >
              <h3>{inscripcion.curso.titulo}</h3>
              <p>{inscripcion.curso.categoria}</p>
              <p>{inscripcion.completado ? '✅ Completado' : '🔄 En progreso'}</p>

              <Link to={`/cursos/${inscripcion.curso.id}/aprender`}>
                <button>{inscripcion.completado ? 'Repasar curso' : 'Continuar curso'}</button>
              </Link>

              {inscripcion.completado && (
                <div>
                  <button
                    onClick={() => handleVerCertificado(inscripcion.id)}
                    disabled={generandoCertificado === inscripcion.id}
                  >
                    {generandoCertificado === inscripcion.id ? 'Generando...' : '🎓 Ver certificado'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MisCursos;
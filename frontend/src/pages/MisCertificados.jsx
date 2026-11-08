import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { misCertificadosRequest, emitirCertificadoRequest } from '../services/certificadoService';

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function MisCertificados() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [generando, setGenerando] = useState(null);

  useEffect(() => {
    cargarCertificados();
  }, []);

  async function cargarCertificados() {
    try {
      const data = await misCertificadosRequest();
      setItems(data);
    } catch (err) {
      setError('No se pudieron cargar tus certificados');
    } finally {
      setCargando(false);
    }
  }

  // Si el PDF todavía no se generó, se genera ahora; si ya existe, se abre el mismo.
  async function handleVerCertificado(item) {
    const nuevaPestana = window.open('', '_blank');
    setGenerando(item.idInscripcion);
    try {
      const certificado = await emitirCertificadoRequest(item.idInscripcion);
      nuevaPestana.location.href = certificado.urlPdf;
      setItems((actuales) =>
        actuales.map((i) => (i.idInscripcion === item.idInscripcion ? { ...i, certificado } : i))
      );
    } catch (err) {
      nuevaPestana.close();
      setError(err.response?.data?.error || 'Error al generar el certificado');
    } finally {
      setGenerando(null);
    }
  }

  if (cargando) {
    return <p className="text-muted">Cargando...</p>;
  }

  return (
    <div className="cuenta-seccion">
        <div className="cuenta-seccion-cab">
          <h2 className="cuenta-seccion-titulo">Mis certificados</h2>
          <p className="cuenta-seccion-sub">
            {items.length === 0
              ? 'Todavía no completaste ningún curso con certificado.'
              : `${items.length} certificado${items.length === 1 ? '' : 's'} disponible${items.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {items.length === 0 ? (
          <div className="portal-vacio">
            <p className="text-muted">Cuando termines un curso, vas a poder descargar acá tu certificado.</p>
            <Link to="/mis-cursos" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Ir a mis cursos
            </Link>
          </div>
        ) : (
          <div className="cuenta-lista">
            {items.map((item) => (
              <div key={item.idInscripcion} className="cuenta-fila">
                <div className="cuenta-thumb">
                  {item.curso.imagenPortada && <img src={item.curso.imagenPortada} alt="" />}
                </div>

                <div className="cuenta-info">
                  <Link to={`/cursos/${item.curso.id}`} className="cuenta-titulo">
                    {item.curso.titulo}
                  </Link>
                  <p className="cuenta-meta">
                    {item.certificado
                      ? `Emitido el ${formatearFecha(item.certificado.fechaEmision)}`
                      : 'Curso completado · Listo para generar'}
                  </p>
                </div>

                <div className="cuenta-lado">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleVerCertificado(item)}
                    disabled={generando === item.idInscripcion}
                  >
                    {generando === item.idInscripcion ? 'Generando...' : item.certificado ? 'Ver certificado' : 'Generar certificado'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default MisCertificados;

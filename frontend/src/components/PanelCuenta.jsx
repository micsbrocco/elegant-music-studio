import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { misCertificadosRequest, emitirCertificadoRequest } from '../services/certificadoService';
import { misComprasRequest } from '../services/pagoService';
import { misConsultasRecientesRequest } from '../services/consultaService';

const ESTADOS_APROBADOS = ['aprobado', 'simulado_aprobado'];

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

// Panel fijo a la derecha de "Mis cursos": resumen de la cuenta del alumno
// (datos, certificados y última compra). Para editar datos o ver el historial
// completo de compras, lleva a las páginas de la cuenta.
function PanelCuenta() {
  const { usuario } = useAuth();
  const location = useLocation();
  // Mi cuenta y Mis compras se abren como ventana encima de esta página
  const fondo = (location.state && location.state.backgroundLocation) || location;
  const [certificados, setCertificados] = useState([]);
  const [ultimaCompra, setUltimaCompra] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(null);
  const [error, setError] = useState('');
  const [preguntas, setPreguntas] = useState({ items: [], sinVer: 0 });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    // Las dos llamadas son independientes: si una falla, la otra se muestra igual.
    const [resCertificados, resCompras, resPreguntas] = await Promise.allSettled([
      misCertificadosRequest(),
      misComprasRequest(),
      misConsultasRecientesRequest(),
    ]);
    if (resPreguntas.status === 'fulfilled') setPreguntas(resPreguntas.value);

    if (resCertificados.status === 'fulfilled') {
      setCertificados(resCertificados.value);
    }
    if (resCompras.status === 'fulfilled') {
      const aprobadas = resCompras.value
        .filter((c) => ESTADOS_APROBADOS.includes(c.estado))
        .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
      setUltimaCompra(aprobadas[0] || null);
    }
    setCargando(false);
  }

  // Igual que en Mis certificados: si el PDF no existe todavía se genera, y se abre en otra pestaña.
  async function handleVerCertificado(item) {
    const nuevaPestana = window.open('', '_blank');
    setGenerando(item.idInscripcion);
    setError('');
    try {
      const certificado = await emitirCertificadoRequest(item.idInscripcion);
      nuevaPestana.location.href = certificado.urlPdf;
    } catch (err) {
      nuevaPestana.close();
      setError(err.response?.data?.error || 'No se pudo abrir el certificado');
    } finally {
      setGenerando(null);
    }
  }

  return (
    <aside className="panel-cuenta" aria-label="Tu cuenta">
      {/* El aside ocupa todo el alto de la página; el contenido queda fijo al hacer scroll */}
      <div className="panel-cuenta-contenido">
      <div className="panel-cuenta-usuario">
        {usuario?.fotoPerfil ? (
          <img src={usuario.fotoPerfil} referrerPolicy="no-referrer" alt="" className="panel-cuenta-avatar" />
        ) : (
          <div className="panel-cuenta-avatar panel-cuenta-avatar-inicial">{usuario?.nombre?.[0]}</div>
        )}
        <div className="panel-cuenta-identidad">
          <p className="panel-cuenta-nombre">{usuario?.nombre} {usuario?.apellido}</p>
          <p className="panel-cuenta-email">{usuario?.email}</p>
        </div>
      </div>
      <Link to="/perfil" state={{ backgroundLocation: fondo }} className="panel-cuenta-link">Editar perfil →</Link>

      <div className="panel-cuenta-bloque">
        <p className="panel-cuenta-subtitulo">
          Tus preguntas
          {preguntas.sinVer > 0 && (
            <span className="panel-cuenta-nuevas">{preguntas.sinVer} {preguntas.sinVer === 1 ? 'respuesta nueva' : 'respuestas nuevas'}</span>
          )}
        </p>
        {cargando ? (
          <p className="panel-cuenta-vacio">Cargando...</p>
        ) : preguntas.items.length === 0 ? (
          <p className="panel-cuenta-vacio">No hiciste consultas.</p>
        ) : (
          <ul className="panel-cuenta-lista panel-cuenta-preguntas">
            {preguntas.items.map((p) => (
              <li key={p.id}>
                <Link to={`/cursos/${p.idCurso}/aprender?clase=${p.idContenido}`} className={`panel-cuenta-pregunta ${p.nueva ? 'nueva' : ''}`}>
                  <span className="panel-cuenta-pregunta-texto">{p.texto}</span>
                  <span className="panel-cuenta-pregunta-meta">
                    {p.nueva ? (
                      <span className="panel-cuenta-pregunta-estado panel-cuenta-pregunta-estado--nueva">Nueva respuesta</span>
                    ) : p.respondidaEn ? (
                      <span className="panel-cuenta-pregunta-estado panel-cuenta-pregunta-estado--ok">Respondida</span>
                    ) : (
                      <span className="panel-cuenta-pregunta-estado">Esperando respuesta</span>
                    )}
                    {' · '}{p.contenido.titulo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel-cuenta-bloque">
        <p className="panel-cuenta-subtitulo">Certificados</p>
        {cargando ? (
          <p className="panel-cuenta-vacio">Cargando...</p>
        ) : certificados.length === 0 ? (
          <p className="panel-cuenta-vacio">Terminá un curso para obtener tu certificado.</p>
        ) : (
          <ul className="panel-cuenta-lista">
            {certificados.map((item) => (
              <li key={item.idInscripcion}>
                <button
                  type="button"
                  className="panel-cuenta-certificado"
                  onClick={() => handleVerCertificado(item)}
                  disabled={generando === item.idInscripcion}
                  title="Abrir certificado"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="6" /><path d="M15.48 13.5L17 22l-5-3-5 3 1.52-8.5" />
                  </svg>
                  <span>{generando === item.idInscripcion ? 'Generando...' : item.curso.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="panel-cuenta-error">{error}</p>}
      </div>

      <div className="panel-cuenta-bloque">
        <p className="panel-cuenta-subtitulo">Última compra</p>
        {cargando ? (
          <p className="panel-cuenta-vacio">Cargando...</p>
        ) : ultimaCompra ? (
          <>
            <Link to={`/cursos/${ultimaCompra.curso.id}`} className="panel-cuenta-compra">
              {ultimaCompra.curso.titulo}
            </Link>
            <p className="panel-cuenta-meta">
              {formatearFecha(ultimaCompra.fechaPago)} · {formatearMonto(ultimaCompra.monto)}
            </p>
          </>
        ) : (
          <p className="panel-cuenta-vacio">Todavía no hiciste compras.</p>
        )}
        <Link to="/mis-compras" state={{ backgroundLocation: fondo }} className="panel-cuenta-link">Ver todas las compras →</Link>
      </div>
      </div>
    </aside>
  );
}

export default PanelCuenta;

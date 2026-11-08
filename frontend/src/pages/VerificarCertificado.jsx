import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { verificarCertificadoRequest } from '../services/certificadoService';
import logoElegant from '../assets/logo-elegant.png';

// Página pública: el QR del certificado lleva acá (/verificar/CODIGO).
// También se puede escribir el código a mano.
function VerificarCertificado() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [texto, setTexto] = useState(codigo || '');
  const [estado, setEstado] = useState(codigo ? 'cargando' : 'inicio'); // inicio | cargando | valido | anulado | invalido | error
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    if (!codigo) {
      setEstado('inicio');
      return;
    }
    setTexto(codigo);
    setEstado('cargando');
    verificarCertificadoRequest(codigo)
      .then((d) => {
        setDatos(d);
        setEstado(d.valido ? 'valido' : 'anulado');
      })
      .catch((err) => setEstado(err.response?.status === 404 ? 'invalido' : 'error'));
  }, [codigo]);

  function buscar(e) {
    e.preventDefault();
    const limpio = texto.trim();
    if (limpio) navigate(`/verificar/${encodeURIComponent(limpio)}`);
  }

  const fecha = datos?.fechaEmision
    ? new Date(datos.fechaEmision).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <div className="auth-card-accent" />
        <div className="auth-card-body auth-card-body-centrado">
          <div className="auth-brand">
            <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
          </div>
          <h2 className="font-display auth-titulo">Verificar certificado</h2>

          {estado === 'cargando' && <p className="text-muted">Verificando…</p>}

          {(estado === 'valido' || estado === 'anulado') && datos && (
            <div className={`verif-resultado ${estado === 'valido' ? 'verif-ok' : 'verif-mal'}`}>
              <p className="verif-estado">{estado === 'valido' ? '✓ Certificado válido' : '✕ Certificado anulado'}</p>
              <dl className="verif-datos">
                <dt>Alumno</dt><dd>{datos.nombre}</dd>
                <dt>Curso</dt><dd>{datos.curso}</dd>
                <dt>Emitido</dt><dd>{fecha}</dd>
                <dt>Código</dt><dd className="verif-codigo">{datos.codigo}</dd>
              </dl>
            </div>
          )}

          {estado === 'invalido' && (
            <div className="verif-resultado verif-mal">
              <p className="verif-estado">✕ No existe un certificado con ese código</p>
            </div>
          )}
          {estado === 'error' && <div className="error-box">No se pudo verificar. Probá de nuevo.</div>}

          <form onSubmit={buscar} className="verif-form">
            <input
              className="input verif-input"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              aria-label="Código de verificación"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary">Verificar</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VerificarCertificado;

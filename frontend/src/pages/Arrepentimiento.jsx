import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enviarArrepentimientoRequest, obtenerPoliticaArrepentimientoRequest } from '../services/arrepentimientoService';
import logoElegant from '../assets/logo-elegant.png';
import { useAuth } from '../context/AuthContext';

// Botón de arrepentimiento: obligatorio para vender online en Argentina.
// Se usa sin iniciar sesión; la persona recibe un código por email.
function Arrepentimiento() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState({
    nombre: usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : '',
    email: usuario?.email || '',
    referencia: '',
    motivo: '',
  });
  const [dias, setDias] = useState(10);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    // Se llega desde el pie de página: arrancar arriba, no donde estaba el scroll
    window.scrollTo(0, 0);
    obtenerPoliticaArrepentimientoRequest().then((p) => setDias(p.diasLimite)).catch(() => {});
  }, []);

  function cambiar(campo) {
    return (e) => setDatos((previos) => ({ ...previos, [campo]: e.target.value }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      setResultado(await enviarArrepentimientoRequest(datos));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'No pudimos registrar tu solicitud. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-card arrepentimiento-card">
        <div className="auth-card-accent" />
        <div className="auth-card-body">
          <div className="auth-brand">
            <img src={logoElegant} alt="Elegant Music Studio" className="auth-logo" />
          </div>

          <h1 className="font-display auth-titulo">
            Botón de <em className="italic-gold">arrepentimiento</em>
          </h1>

          {resultado ? (
            <div className="arrepentimiento-listo" role="status">
              <p className="arrepentimiento-listo-titulo">Recibimos tu solicitud</p>
              <p className="arrepentimiento-codigo">{resultado.codigo}</p>
              <p className="text-muted">
                {resultado.emailEnviado
                  ? `Te enviamos este código a ${datos.email}. Vamos a revisar tu compra y te respondemos a ese email.`
                  : 'Guardá este código. Vamos a revisar tu compra y te respondemos a tu email.'}
              </p>
              <Link to="/" className="btn btn-primary auth-submit">Volver al inicio</Link>
            </div>
          ) : (
            <>
              <p className="text-muted auth-subtitulo">
                Podés arrepentirte de una compra dentro de los {dias} días corridos. No hace falta iniciar sesión.
                La devolución se hace al mismo medio con el que pagaste.
              </p>

              {error && <div className="error-box">{error}</div>}

              <form onSubmit={enviar}>
                <div className="field">
                  <label className="label" htmlFor="arr-nombre">Nombre y apellido</label>
                  <input id="arr-nombre" className="input" value={datos.nombre} onChange={cambiar('nombre')} required maxLength={120} autoComplete="name" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="arr-email">Email con el que compraste</label>
                  <input id="arr-email" type="email" className="input" value={datos.email} onChange={cambiar('email')} required maxLength={160} autoComplete="email" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="arr-referencia">Curso o N° de operación <span className="arrepentimiento-opcional">(opcional)</span></label>
                  <input id="arr-referencia" className="input" value={datos.referencia} onChange={cambiar('referencia')} maxLength={200} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="arr-motivo">Motivo <span className="arrepentimiento-opcional">(opcional)</span></label>
                  <textarea id="arr-motivo" className="input" rows={3} value={datos.motivo} onChange={cambiar('motivo')} maxLength={1000} />
                </div>
                <button type="submit" className="btn btn-primary auth-submit" disabled={enviando}>
                  {enviando ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Arrepentimiento;

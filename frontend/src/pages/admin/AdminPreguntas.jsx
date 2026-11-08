import { useCallback, useEffect, useState } from 'react';
import { listarConsultasRequest, responderConsultaRequest } from '../../services/consultaService';
import FiltroSegmentado from '../../components/FiltroSegmentado';
import { CeldaPersona } from './tablaAdmin';
import { Paginacion } from './filtrosAdmin';
import { useAuth } from '../../context/AuthContext';

function haceCuanto(fecha) {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 60) return minutos < 1 ? 'recién' : `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

// Una pregunta con su caja de respuesta (o la respuesta ya enviada, editable)
function ItemPregunta({ consulta, idUsuario, onRespondida, onRecargar }) {
  const [editando, setEditando] = useState(!consulta.respuesta);
  const [texto, setTexto] = useState(consulta.respuesta || '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setError('');
    try {
      const actualizada = await responderConsultaRequest(consulta.id, texto.trim());
      onRespondida(consulta.id, actualizada);
      setEditando(false);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar la respuesta');
      // Otra persona la respondió mientras tanto: se actualiza la lista
      if (err.response?.status === 409 || err.response?.status === 403) setTimeout(onRecargar, 2500);
    } finally {
      setEnviando(false);
    }
  }

  // Una respuesta la edita solo quien la escribió
  const esMia = !consulta.respondedor || consulta.respondedor.id === idUsuario;

  return (
    <li className="admin-pregunta">
      <div className="admin-pregunta-cabecera">
        <CeldaPersona
          nombre={`${consulta.alumno.nombre} ${consulta.alumno.apellido}`}
          detalle={consulta.alumno.email}
          foto={consulta.alumno.fotoPerfil}
        />
        <div className="admin-pregunta-donde">
          <span className="admin-pregunta-curso">{consulta.curso.titulo}</span>
          <span>{consulta.contenido.titulo} · {haceCuanto(consulta.creadaEn)}</span>
        </div>
      </div>
      <p className="admin-pregunta-texto">{consulta.texto}</p>

      {editando ? (
        <form className="admin-pregunta-form" onSubmit={enviar}>
          <textarea
            className="admin-input"
            rows={3}
            maxLength={2000}
            aria-label={`Respuesta a ${consulta.alumno.nombre}`}
            placeholder="Escribí tu respuesta. Le llega por mail al alumno."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          {error && <p className="modal-nuevo-curso-error">{error}</p>}
          <div className="admin-pregunta-acciones">
            {consulta.respuesta && (
              <button type="button" className="admin-tabla-accion" onClick={() => { setTexto(consulta.respuesta); setEditando(false); }}>
                Cancelar
              </button>
            )}
            <button type="submit" className={`admin-boton-primario ${consulta.respuesta ? 'admin-boton-guardar' : ''}`} disabled={!texto.trim() || enviando}>
              {enviando ? 'Enviando…' : consulta.respuesta ? 'Guardar respuesta' : 'Responder'}
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-pregunta-respuesta">
          <span className="admin-pregunta-quien">
            {consulta.respondedor
              ? `Respondió ${esMia ? 'vos' : `${consulta.respondedor.nombre} ${consulta.respondedor.apellido}`.trim()}`
              : 'Respuesta'}
            {consulta.respondidaEn && ` · ${haceCuanto(consulta.respondidaEn)}`}
          </span>
          <p>{consulta.respuesta}</p>
          {esMia ? (
            <button type="button" className="admin-filtro-quitar" onClick={() => setEditando(true)}>Editar respuesta</button>
          ) : (
            <span className="admin-pregunta-nota">Solo quien la escribió puede editarla.</span>
          )}
        </div>
      )}
    </li>
  );
}

// Preguntas privadas de los alumnos (admin: todas; instructor: las de sus cursos)
function AdminPreguntas() {
  const { usuario } = useAuth();
  const [vista, setVista] = useState('pendientes');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(() => {
    listarConsultasRequest({ vista, pagina }).then(setDatos).catch(() => setDatos({ items: [], total: 0, pagina: 1, porPagina: 10, pendientes: 0 }));
  }, [vista, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  function alResponder(id, actualizada) {
    setDatos((d) => ({
      ...d,
      items: d.items.map((c) => (c.id === id ? { ...c, ...actualizada } : c)),
    }));
    // El número del menú se actualiza
    window.dispatchEvent(new Event('consultas-actualizadas'));
  }

  return (
    <>
      <div className="admin-page-header">
        <h2>Preguntas</h2>
        <p className="admin-page-sub">Dudas privadas de los alumnos sobre las clases.</p>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-titulo admin-dash-card-titulo">
            {vista === 'pendientes' ? 'Sin responder' : 'Respondidas'} <span className="admin-dash-card-titulo-extra">({datos?.total ?? 0})</span>
          </h3>
          <FiltroSegmentado
            etiqueta="Preguntas"
            className="admin-segmentado"
            opciones={[{ id: 'pendientes', etiqueta: 'Sin responder' }, { id: 'respondidas', etiqueta: 'Respondidas' }]}
            valor={vista}
            onCambiar={(v) => { setVista(v); setPagina(1); }}
          />
        </div>

        {!datos ? (
          <p className="admin-dash-vacio admin-dash-vacio--izq">Cargando…</p>
        ) : datos.items.length === 0 ? (
          <p className="admin-dash-vacio admin-dash-vacio--izq">
            {vista === 'pendientes' ? 'No hay preguntas sin responder.' : 'Todavía no respondiste ninguna pregunta.'}
          </p>
        ) : (
          <ul className="admin-preguntas-lista">
            {datos.items.map((c) => <ItemPregunta key={`${c.id}-${vista}`} consulta={c} idUsuario={usuario?.id} onRespondida={alResponder} onRecargar={cargar} />)}
          </ul>
        )}
        {datos && <Paginacion pagina={datos.pagina} porPagina={datos.porPagina} total={datos.total} onCambiar={setPagina} />}
      </div>
    </>
  );
}

export default AdminPreguntas;

import { useState, useEffect } from 'react';
import {
  listarUsuariosParaInstructoresRequest,
  cambiarRolUsuarioRequest,
  listarCursosDeUsuarioRequest,
  listarHistorialInstructoresRequest,
} from '../../services/usuarioService';
import { descargarCsv } from '../../services/reporteService';
import { SkeletonListaAdmin } from '../../components/Skeleton';
import { CeldaPersona } from './tablaAdmin';
import { BuscadorDiferido, Paginacion, useListadoAdmin, FiltroFechas, FiltroSelect, fechasDeAtajo, textoRango, nombreExportacion } from './filtrosAdmin';
import { IconoDescarga } from './tablaAdmin';

const pedirHistorial = (params) => listarHistorialInstructoresRequest({ ...params, porPagina: 10 });
const MOVIMIENTOS = [
  { id: '', etiqueta: 'Altas y bajas' },
  { id: 'alta', etiqueta: 'Solo altas' },
  { id: 'baja', etiqueta: 'Solo bajas' },
];

function IconoHistorial() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

// Registro de altas y bajas de instructores: se ve por período y se descarga
// en Excel con los mismos filtros.
function ModalHistorial({ onCerrar }) {
  const historial = useListadoAdmin(pedirHistorial, { fechas: fechasDeAtajo('12m'), accion: '', buscar: '' });
  const datos = historial.datos || { items: [], total: 0, pagina: 1, porPagina: 10 };
  const { pagina, porPagina, ...paraExportar } = historial.parametros;

  useEffect(() => {
    function alTeclear(e) {
      if (e.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  return (
    <div className="admin-modal-fondo" onClick={onCerrar}>
      <div className="admin-modal admin-modal-historial" role="dialog" aria-modal="true" aria-labelledby="historial-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h3 id="historial-titulo" className="admin-modal-titulo">Registro de instructores</h3>
          <button type="button" className="admin-modal-cerrar" aria-label="Cerrar" onClick={onCerrar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="admin-filtros-barra admin-filtros-barra--card">
          <FiltroFechas fechas={historial.filtros.fechas} onCambiar={(fechas) => historial.cambiar({ fechas })} etiqueta="Período" />
          <FiltroSelect etiqueta="Movimiento" valor={historial.filtros.accion} opciones={MOVIMIENTOS} onCambiar={(accion) => historial.cambiar({ accion })} />
          <button
            type="button"
            className="admin-tabla-accion admin-tabla-accion--dorada admin-historial-exportar"
            disabled={datos.total === 0}
            onClick={() => descargarCsv(
              '/usuarios/instructores/historial/exportar',
              nombreExportacion('registro-instructores', historial.filtros.fechas),
              { ...paraExportar, periodo: textoRango(historial.filtros.fechas) },
            )}
          >
            <IconoDescarga />
            Exportar ({datos.total})
          </button>
        </div>

        {datos.items.length === 0 ? (
          <p className="admin-dash-vacio admin-dash-vacio--izq">{historial.cargando ? 'Cargando…' : 'No hay movimientos en este período.'}</p>
        ) : (
          <div className={`admin-tabla-wrap ${historial.cargando ? 'admin-actualizando' : ''}`}>
            <table className="admin-tabla-cursos">
              <thead>
                <tr><th>Fecha</th><th>Instructor</th><th>Movimiento</th><th>Realizado por</th></tr>
              </thead>
              <tbody>
                {datos.items.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.fecha).toLocaleDateString('es-AR')}</td>
                    <td><CeldaPersona nombre={h.nombre} detalle={h.email} /></td>
                    <td>
                      <span className={`admin-tabla-pill ${h.accion === 'alta' ? 'admin-tabla-pill--ok' : 'admin-tabla-pill--error'}`}>
                        {h.accion === 'alta' ? 'Alta' : 'Baja'}
                      </span>
                    </td>
                    <td className="admin-tabla-tenue" title={h.nota || undefined}>{h.nombreAdmin || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion pagina={datos.pagina} porPagina={datos.porPagina} total={datos.total} onCambiar={(p) => historial.cambiar({ pagina: p })} />
      </div>
    </div>
  );
}

// Candidatos a instructor: solo alumnos activos, buscados en el servidor de a 10
function pedirCandidatos(params) {
  return listarUsuariosParaInstructoresRequest({ ...params, porPagina: 10, rol: 'alumno' });
}

function IconoBusqueda() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const ESTADOS_CURSO = { activo: 'Activo', oculto: 'Oculto', borrador: 'Borrador' };

function ListaCursos({ titulo, cursos, vacio, mostrarVisibilidad }) {
  return (
    <section className="admin-instr-seccion">
      <h4 className="admin-instr-seccion-titulo">
        {titulo} <span className="admin-dash-card-titulo-extra">({cursos.length})</span>
      </h4>
      {cursos.length === 0 ? (
        <p className="admin-dash-vacio admin-dash-vacio--izq">{vacio}</p>
      ) : (
        <ul className="admin-instr-cursos">
          {cursos.map((c) => (
            <li key={c.id} className="admin-instr-curso">
              <div className="admin-instr-curso-datos">
                <span className="admin-alumno-nombre">{c.titulo}</span>
                <span className="admin-alumno-meta">
                  {c.categoria}
                  {mostrarVisibilidad && ` · ${c.visible ? (c.etiqueta || 'Figura como instructor') : 'Colaborador interno'}`}
                </span>
              </div>
              <span className={`admin-instr-estado admin-instr-estado--${c.estado}`}>
                {ESTADOS_CURSO[c.estado] || c.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function normalizar(texto) {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function AdminInstructores() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [cambiandoId, setCambiandoId] = useState(null);
  const [busquedaInstructores, setBusquedaInstructores] = useState('');
  const candidatos = useListadoAdmin(pedirCandidatos, { buscar: '' });
  const [detalle, setDetalle] = useState(null); // { usuario, cursos, cargando, error }
  const [confirmacion, setConfirmacion] = useState(null); // { usuario, rol } a confirmar
  const [verHistorial, setVerHistorial] = useState(false);

  useEffect(() => {
    if (!detalle && !confirmacion) return undefined;
    function alTeclear(e) {
      if (e.key !== 'Escape') return;
      if (confirmacion) setConfirmacion(null);
      else setDetalle(null);
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [detalle, confirmacion]);

  async function confirmarCambio() {
    const { usuario, rol } = confirmacion;
    await handleCambiarRol(usuario, rol);
    setConfirmacion(null);
  }

  async function abrirDetalle(usuario) {
    setDetalle({ usuario, cursos: null, cargando: true, error: '' });
    try {
      const cursos = await listarCursosDeUsuarioRequest(usuario.id);
      setDetalle((prev) => (prev && prev.usuario.id === usuario.id ? { ...prev, cursos, cargando: false } : prev));
    } catch (err) {
      setDetalle((prev) => (prev && prev.usuario.id === usuario.id
        ? { ...prev, cargando: false, error: 'No se pudieron cargar los cursos' }
        : prev));
    }
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      const data = await listarUsuariosParaInstructoresRequest({ rol: 'profesor' });
      setUsuarios(data.items);
    } catch (err) {
      setError('Error al cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarRol(usuario, nuevoRol) {
    setCambiandoId(usuario.id);
    try {
      await cambiarRolUsuarioRequest(usuario.id, nuevoRol);
      // Cambia quién está en cada lista: se vuelven a pedir las dos
      await Promise.all([cargarUsuarios(), candidatos.recargar()]);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar el rol del usuario');
    } finally {
      setCambiandoId(null);
    }
  }

  if (cargando) return <SkeletonListaAdmin />;
  if (error) return <div className="admin-dash-estado admin-dash-estado--error">{error}</div>;

  const instructores = usuarios
    .filter((u) => u.rol === 'profesor')
    .filter((u) => normalizar(`${u.nombre} ${u.apellido}`).includes(normalizar(busquedaInstructores)));
  const datosCandidatos = candidatos.datos || { items: [], total: 0, pagina: 1, porPagina: 20 };
  const alumnos = datosCandidatos.items;

  return (
    <div className="admin-instructores">
      <div className="admin-page-header">
        <h2>Instructores</h2>
      </div>
      <div className="admin-instructores-grid">
      <div className="admin-card admin-gestionar-cursos">
        <div className="admin-card-header">
          <h3 className="admin-card-titulo">
            Instructores activos <span className="admin-dash-card-titulo-extra">({instructores.length})</span>
          </h3>
          <div className="admin-instr-cabecera-acciones">
            <div className="admin-tabla-busqueda">
              <IconoBusqueda />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busquedaInstructores}
                onChange={(e) => setBusquedaInstructores(e.target.value)}
              />
            </div>
            <button type="button" className="admin-tabla-accion admin-tabla-accion--dorada" onClick={() => setVerHistorial(true)}>
              <IconoHistorial />
              Registro de altas y bajas
            </button>
          </div>
        </div>
        {instructores.length === 0 ? (
          <p className="admin-dash-vacio">
            {busquedaInstructores
              ? 'Ningún instructor coincide con esa búsqueda.'
              : 'Todavía no le diste el rol de instructor a nadie.'}
          </p>
        ) : (
          <div className="admin-tabla-wrap">
            <table className="admin-tabla-cursos">
              <thead>
                <tr>
                  <th>Instructor</th>
                  <th>Desde</th>
                  <th className="admin-tabla-num">Creados</th>
                  <th className="admin-tabla-num">Colabora en</th>
                  <th className="admin-tabla-derecha">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {instructores.map((u) => (
                  <tr
                    key={u.id}
                    className="admin-instr-fila"
                    tabIndex={0}
                    title="Doble click para ver sus cursos"
                    onDoubleClick={() => abrirDetalle(u)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) abrirDetalle(u);
                    }}
                  >
                    <td><CeldaPersona nombre={`${u.nombre} ${u.apellido}`} detalle={u.email} foto={u.fotoPerfil} /></td>
                    <td>{u.fechaAlta ? new Date(u.fechaAlta).toLocaleDateString('es-AR') : '—'}</td>
                    <td className="admin-tabla-num">{u._count.cursosCreados}</td>
                    <td className="admin-tabla-num">{u._count.colaboraciones}</td>
                    <td>
                      <div className="admin-instr-acciones">
                        <button
                          type="button"
                          className="admin-instr-boton"
                          onClick={() => abrirDetalle(u)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                          </svg>
                          Ver cursos
                        </button>
                        <button
                          type="button"
                          className="admin-instr-boton admin-instr-boton--quitar"
                          disabled={cambiandoId === u.id}
                          onClick={() => setConfirmacion({ usuario: u, rol: 'alumno' })}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 11h6" />
                          </svg>
                          Quitar rol
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card admin-instructores-alta">
        <div className="admin-card-header">
          <h3 className="admin-card-titulo">
            Dar de alta un nuevo instructor
          </h3>
        </div>
        <BuscadorDiferido
          valor={candidatos.filtros.buscar}
          onCambiar={(buscar) => candidatos.cambiar({ buscar })}
          placeholder="Buscar alumno por nombre o email..."
        />
        {alumnos.length === 0 ? (
          <p className="admin-dash-vacio">
            {candidatos.filtros.buscar ? 'Ningún alumno activo coincide con esa búsqueda.' : 'Todavía no hay alumnos activos.'}
          </p>
        ) : (
          <div className="admin-alumnos-lista">
            {alumnos.map((u) => (
              <div key={u.id} className="admin-alumno-fila">
                <div className="admin-alumno-avatar" aria-hidden="true">
                  {u.fotoPerfil ? <img src={u.fotoPerfil} alt="" /> : null}
                  {!u.fotoPerfil && `${u.nombre?.[0] || ''}${u.apellido?.[0] || ''}`.toUpperCase()}
                </div>
                <div className="admin-alumno-datos">
                  <span className="admin-alumno-nombre">{u.nombre} {u.apellido}</span>
                  <span className="admin-alumno-meta">
                    {u.email} · {new Date(u.fechaRegistro).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-tabla-accion admin-tabla-accion--contorno"
                  disabled={cambiandoId === u.id}
                  onClick={() => setConfirmacion({ usuario: u, rol: 'profesor' })}
                >
                  Dar de alta
                </button>
              </div>
            ))}
          </div>
        )}
        <Paginacion
          pagina={datosCandidatos.pagina}
          porPagina={datosCandidatos.porPagina}
          total={datosCandidatos.total}
          onCambiar={(p) => candidatos.cambiar({ pagina: p })}
        />
      </div>
      </div>

      {verHistorial && <ModalHistorial onCerrar={() => setVerHistorial(false)} />}

      {confirmacion && (() => {
        const { usuario, rol } = confirmacion;
        const alta = rol === 'profesor';
        const nombre = `${usuario.nombre} ${usuario.apellido}`;
        return (
          <div className="admin-modal-fondo" onClick={() => setConfirmacion(null)}>
            <div
              className="admin-modal admin-modal--confirmar"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="admin-instr-confirmar-titulo"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="admin-instr-confirmar-titulo" className="admin-modal-titulo">
                {alta ? '¿Desea dar de alta a ' : '¿Desea quitar el rol de instructor a '}
                <span className="admin-modal-resaltado">{nombre}</span>?
              </h3>
              <p className="admin-modal-texto">
                <strong className="admin-modal-resaltado">&lt;{usuario.email}&gt;</strong>
                {alta
                  ? ' pasará a ser instructor.'
                  : ' volverá a ser alumno y perderá el acceso de instructor.'}
              </p>
              <div className="admin-modal-acciones">
                <button
                  type="button"
                  className="admin-tabla-accion"
                  autoFocus
                  disabled={cambiandoId === usuario.id}
                  onClick={() => setConfirmacion(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`admin-tabla-accion ${alta ? 'admin-tabla-accion--exito' : 'admin-tabla-accion--peligro'}`}
                  disabled={cambiandoId === usuario.id}
                  onClick={confirmarCambio}
                >
                  {alta ? 'Sí, dar de alta' : 'Sí, quitar rol'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {detalle && (
        <div className="admin-modal-fondo" onClick={() => setDetalle(null)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-instr-detalle-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <h3 id="admin-instr-detalle-titulo" className="admin-modal-titulo">
                  {detalle.usuario.nombre} {detalle.usuario.apellido}
                </h3>
                <p className="admin-alumno-meta">{detalle.usuario.email}</p>
              </div>
              <button type="button" className="admin-modal-cerrar" aria-label="Cerrar" autoFocus onClick={() => setDetalle(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {detalle.cargando && <p className="admin-dash-estado">Cargando...</p>}
            {detalle.error && <div className="admin-dash-estado admin-dash-estado--error">{detalle.error}</div>}
            {detalle.cursos && (
              <div className="admin-modal-cuerpo">
                <ListaCursos
                  titulo="Cursos que creó"
                  cursos={detalle.cursos.creados}
                  vacio="Todavía no creó ningún curso."
                />
                <ListaCursos
                  titulo="Cursos donde colabora"
                  cursos={detalle.cursos.colaboraciones}
                  vacio="No colabora en ningún curso."
                  mostrarVisibilidad
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInstructores;

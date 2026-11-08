import { Fragment, useEffect, useState } from 'react';
import {
  listarAlumnosRequest, reactivarAlumnoRequest, descargarCsv,
  listarCursosConAlumnosRequest, listarAlumnosDeCursoRequest,
} from '../../services/reporteService';
import {
  CeldaPersona, IconoDescarga, MenuOrden,
} from './tablaAdmin';
import {
  FiltroFechas, FiltroSelect, BuscadorDiferido, Paginacion, useListadoAdmin, fechasDeAtajo, textoRango, nombreExportacion,
} from './filtrosAdmin';
import FiltroSegmentado from '../../components/FiltroSegmentado';
import { SkeletonListaAdmin } from '../../components/Skeleton';

// col + dir arman la clave de orden que entiende el servidor (ej: registro_desc)
const OPCIONES_ALUMNOS = [
  { etiqueta: 'Registro más reciente', col: 'registro', dir: 'desc' },
  { etiqueta: 'Registro más antiguo', col: 'registro', dir: 'asc' },
  { etiqueta: 'Actividad más reciente', col: 'actividad', dir: 'desc' },
  { etiqueta: 'Actividad más antigua', col: 'actividad', dir: 'asc' },
  { etiqueta: 'Nombre (A → Z)', col: 'nombre', dir: 'asc' },
  { etiqueta: 'Nombre (Z → A)', col: 'nombre', dir: 'desc' },
  { etiqueta: 'Más cursos inscriptos', col: 'cursos', dir: 'desc' },
];
const OPCIONES_POR_CURSO = [
  { etiqueta: 'Compra más reciente', col: 'fecha', dir: 'desc' },
  { etiqueta: 'Compra más antigua', col: 'fecha', dir: 'asc' },
  { etiqueta: 'Nombre (A → Z)', col: 'nombre', dir: 'asc' },
  { etiqueta: 'Nombre (Z → A)', col: 'nombre', dir: 'desc' },
];

function ordenDe(clave) {
  if (!clave) return null;
  const [col, dir] = clave.split('_');
  return { col, dir };
}
function sinPaginar({ pagina, porPagina, ...resto }) {
  return resto;
}
// Las dos tablas van lado a lado: de a 10 filas para que no se haga larga la pantalla
const pedirAlumnos = (params) => listarAlumnosRequest({ ...params, porPagina: 10 });
const VACIO_CURSO = { items: [], total: 0, pagina: 1, porPagina: 10, completaron: 0 };
const pedirAlumnosDeCurso = ({ curso, ...params }) => (
  curso ? listarAlumnosDeCursoRequest(curso, { ...params, porPagina: 10 }) : Promise.resolve(VACIO_CURSO)
);

const fechaCorta = (f) => new Date(f).toLocaleDateString('es-AR');

const IconoFlecha = ({ abierto }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function BarraAvance({ porcentaje, completado }) {
  return (
    <span className={`admin-avance ${completado ? 'completo' : ''}`} title={completado ? 'Completó el curso' : `Vio el ${porcentaje}% de las clases`}>
      <span className="admin-avance-barra"><span style={{ width: `${porcentaje}%` }} /></span>
      <span className="admin-avance-texto">{completado ? 'Completó' : `${porcentaje}%`}</span>
    </span>
  );
}

function AdminAlumnos() {
  const alumnos = useListadoAdmin(pedirAlumnos, {
    estado: 'activos',
    fechas: fechasDeAtajo('12m'),
    buscar: '',
    orden: '',
  });
  const porCurso = useListadoAdmin(pedirAlumnosDeCurso, {
    curso: '',
    progreso: 'encurso',
    buscar: '',
    orden: '',
  });
  const [cursos, setCursos] = useState([]);
  const [reactivandoId, setReactivandoId] = useState(null);
  const [desplegado, setDesplegado] = useState(null); // alumno con los cursos a la vista

  // Al entrar se elige el curso con más alumnos
  useEffect(() => {
    listarCursosConAlumnosRequest()
      .then((lista) => {
        setCursos(lista);
        if (lista.length > 0) porCurso.cambiar({ curso: String(lista[0].id) });
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReactivar(alumno) {
    setReactivandoId(alumno.id);
    try {
      await reactivarAlumnoRequest(alumno.id);
      await alumnos.recargar();
    } catch (err) {
      alert('No se pudo reactivar al alumno');
    } finally {
      setReactivandoId(null);
    }
  }

  if (!alumnos.datos && alumnos.cargando) return <SkeletonListaAdmin tarjetas={2} />;
  if (alumnos.error && !alumnos.datos) return <div className="admin-dash-estado admin-dash-estado--error">{alumnos.error}</div>;

  const datosAlumnos = alumnos.datos || { items: [], total: 0, pagina: 1, porPagina: 20, totalInactivos: 0 };
  const datosCurso = porCurso.datos || VACIO_CURSO;
  const cursoElegido = cursos.find((c) => String(c.id) === String(porCurso.filtros.curso));
  const verInactivos = alumnos.filtros.estado === 'inactivos';

  return (
    <>
      <div className="admin-page-header">
        <h2>Alumnos</h2>
      </div>

      <div className="admin-alumnos-grid">
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-titulo">
            Alumnos <span className="admin-dash-card-titulo-extra">({datosAlumnos.total})</span>
          </h3>
          <button
            type="button"
            className="admin-tabla-accion admin-tabla-accion--dorada"
            disabled={datosAlumnos.total === 0}
            title="Exporta solo los alumnos que coinciden con los filtros"
            onClick={() => descargarCsv(
              '/reportes/alumnos/exportar',
              nombreExportacion(`alumnos-${alumnos.filtros.estado}`, alumnos.filtros.fechas),
              { ...sinPaginar(alumnos.parametros), periodo: textoRango(alumnos.filtros.fechas) },
            )}
          >
            <IconoDescarga />
            Exportar ({datosAlumnos.total})
          </button>
        </div>

        <div className="admin-filtros-barra admin-filtros-barra--card">
          <FiltroSegmentado
            className="admin-segmentado"
            etiqueta="Estado de los alumnos"
            opciones={[
              { id: 'activos', etiqueta: 'Activos' },
              { id: 'inactivos', etiqueta: `Inactivos${datosAlumnos.totalInactivos ? ` (${datosAlumnos.totalInactivos})` : ''}` },
            ]}
            valor={alumnos.filtros.estado}
            onCambiar={(estado) => alumnos.cambiar({ estado })}
          />
          <FiltroFechas fechas={alumnos.filtros.fechas} onCambiar={(fechas) => alumnos.cambiar({ fechas })} etiqueta="Registro" />
          {alumnos.cargando && <span className="admin-filtros-cargando" aria-live="polite">Actualizando…</span>}
        </div>

        <BuscadorDiferido valor={alumnos.filtros.buscar} onCambiar={(buscar) => alumnos.cambiar({ buscar })} placeholder="Buscar por nombre o email...">
          <MenuOrden
            opciones={OPCIONES_ALUMNOS}
            orden={ordenDe(alumnos.filtros.orden)}
            onChange={(o) => alumnos.cambiar({ orden: o ? `${o.col}_${o.dir}` : '' })}
          />
        </BuscadorDiferido>

        {datosAlumnos.items.length === 0 ? (
          <p className="admin-dash-vacio admin-dash-vacio--izq">
            {verInactivos ? 'No hay alumnos inactivos.' : 'No hay alumnos con estos filtros.'}
          </p>
        ) : (
          <div className={`admin-tabla-wrap ${alumnos.cargando ? 'admin-actualizando' : ''}`}>
            <table className="admin-tabla-cursos">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Actividad</th>
                  <th>Cursos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datosAlumnos.items.map((a) => {
                  const abierto = desplegado === a.id;
                  const cantidad = a._count.inscripciones;
                  return (
                    <Fragment key={a.id}>
                      <tr className={abierto ? 'admin-fila-abierta' : ''}>
                        <td><CeldaPersona nombre={`${a.nombre} ${a.apellido}`} detalle={a.email} foto={a.fotoPerfil} /></td>
                        <td title={`Se registró el ${fechaCorta(a.fechaRegistro)}`}>{fechaCorta(a.ultimaActividad)}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-alumno-cursos-boton"
                            disabled={cantidad === 0}
                            aria-expanded={abierto}
                            title={cantidad === 0 ? 'No compró cursos' : abierto ? 'Ocultar cursos' : 'Ver qué cursos compró'}
                            onClick={() => setDesplegado(abierto ? null : a.id)}
                          >
                            {cantidad}
                            {cantidad > 0 && <IconoFlecha abierto={abierto} />}
                          </button>
                        </td>
                        <td>
                          {a.activo ? (
                            <span className="admin-tabla-pill admin-tabla-pill--ok">Activo</span>
                          ) : (
                            <button
                              type="button"
                              className="admin-tabla-accion admin-tabla-accion--contorno"
                              title="Inactivo: sin actividad hace más de 90 días. Tocá para reactivarlo."
                              disabled={reactivandoId === a.id}
                              onClick={() => handleReactivar(a)}
                            >
                              Reactivar
                            </button>
                          )}
                        </td>
                      </tr>
                      {abierto && (
                        <tr className="admin-fila-detalle">
                          <td colSpan={4}>
                            <ul className="admin-alumno-cursos">
                              {a.cursos.map((c) => (
                                <li key={c.idInscripcion}>
                                  <div className="admin-alumno-curso-datos">
                                    <span className="admin-alumno-curso-titulo" title={c.titulo}>{c.titulo}</span>
                                    <span className="admin-alumno-curso-fecha">Compró el {fechaCorta(c.fecha)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="admin-alumno-curso-ver"
                                    title="Ver su avance en el panel de la derecha"
                                    onClick={() => porCurso.cambiar({
                                      curso: String(c.idCurso),
                                      progreso: c.completado ? 'completaron' : 'encurso',
                                      buscar: a.email,
                                    })}
                                  >
                                    Ver avance →
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion
          pagina={datosAlumnos.pagina}
          porPagina={datosAlumnos.porPagina}
          total={datosAlumnos.total}
          onCambiar={(p) => alumnos.cambiar({ pagina: p })}
        />
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-titulo">
            Alumnos por curso {cursoElegido && <span className="admin-dash-card-titulo-extra">({cursoElegido.alumnos})</span>}
          </h3>
          {cursoElegido && cursoElegido.alumnos > 0 && (
            <span className="admin-alumnos-curso-resumen">
              {datosCurso.completaron} {datosCurso.completaron === 1 ? 'lo completó' : 'lo completaron'}
            </span>
          )}
        </div>

        <div className="admin-filtros-barra admin-filtros-barra--card">
          <FiltroSelect
            etiqueta="Curso"
            valor={porCurso.filtros.curso}
            opciones={cursos.map((c) => ({ id: String(c.id), etiqueta: `${c.titulo} (${c.alumnos})` }))}
            onCambiar={(curso) => porCurso.cambiar({ curso })}
          />
          <FiltroSegmentado
            className="admin-segmentado"
            etiqueta="Avance"
            opciones={[
              { id: 'encurso', etiqueta: 'En curso' },
              { id: 'completaron', etiqueta: 'Completaron' },
            ]}
            valor={porCurso.filtros.progreso}
            onCambiar={(progreso) => porCurso.cambiar({ progreso })}
          />
          {porCurso.cargando && <span className="admin-filtros-cargando" aria-live="polite">Actualizando…</span>}
        </div>

        <BuscadorDiferido valor={porCurso.filtros.buscar} onCambiar={(buscar) => porCurso.cambiar({ buscar })} placeholder="Buscar alumno por nombre o email...">
          <MenuOrden
            opciones={OPCIONES_POR_CURSO}
            orden={ordenDe(porCurso.filtros.orden)}
            onChange={(o) => porCurso.cambiar({ orden: o ? `${o.col}_${o.dir}` : '' })}
          />
        </BuscadorDiferido>

        {datosCurso.items.length === 0 ? (
          <p className="admin-dash-vacio admin-dash-vacio--izq">
            {cursos.length === 0 ? 'Todavía no hay cursos.' : 'No hay alumnos con estos filtros.'}
          </p>
        ) : (
          <div className={`admin-tabla-wrap ${porCurso.cargando ? 'admin-actualizando' : ''}`}>
            <table className="admin-tabla-cursos">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Compra</th>
                  <th>Avance</th>
                </tr>
              </thead>
              <tbody>
                {datosCurso.items.map((i) => (
                  <tr key={i.idInscripcion}>
                    <td><CeldaPersona nombre={`${i.alumno.nombre} ${i.alumno.apellido}`} detalle={i.alumno.email} foto={i.alumno.fotoPerfil} /></td>
                    <td>{fechaCorta(i.fecha)}</td>
                    <td><BarraAvance porcentaje={i.porcentaje} completado={i.completado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion
          pagina={datosCurso.pagina}
          porPagina={datosCurso.porPagina}
          total={datosCurso.total}
          onCambiar={(p) => porCurso.cambiar({ pagina: p })}
        />
      </div>
      </div>
    </>
  );
}

export default AdminAlumnos;

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { listarCursosAdminRequest, listarCategoriasRequest, cambiarEstadoCursoRequest, archivarCursoRequest } from '../../services/cursoService';
import FiltroSegmentado from '../../components/FiltroSegmentado';
import ModalNuevoCurso from './ModalNuevoCurso';
import { useAuth } from '../../context/AuthContext';
import TablaCursosAdmin from './TablaCursosAdmin';
import { ordenar, MenuOrden } from './tablaAdmin';
import { SkeletonListaAdmin } from '../../components/Skeleton';

const ORDEN_CURSOS = {
  titulo: (c) => c.titulo,
  precio: (c) => Number(c.precio || 0),
  alumnos: (c) => c._count?.inscripciones ?? 0,
};
const OPCIONES_CURSOS = [
  { etiqueta: 'Título (A → Z)', col: 'titulo', dir: 'asc' },
  { etiqueta: 'Título (Z → A)', col: 'titulo', dir: 'desc' },
  { etiqueta: 'Más alumnos', col: 'alumnos', dir: 'desc' },
  { etiqueta: 'Precio: mayor a menor', col: 'precio', dir: 'desc' },
  { etiqueta: 'Precio: menor a mayor', col: 'precio', dir: 'asc' },
];

// Para que buscar "teoria" encuentre "Teoría" (y viceversa): se le sacan los
// acentos a los dos lados de la comparación, no solo se pasa a minúsculas.
function normalizarTexto(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Pestañas por estado, en el orden en que se usan. Por defecto: Activos.
// No hay "Todos": siempre se ve un estado a la vez.
const PESTANAS = [
  { id: 'activo', etiqueta: 'Activos' },
  { id: 'oculto', etiqueta: 'Ocultos' },
  { id: 'borrador', etiqueta: 'Borradores' },
  { id: 'archivado', etiqueta: 'Archivados' },
];
// El instructor no archiva ni restaura: no ve esa pestaña
const PESTANAS_INSTRUCTOR = PESTANAS.filter((p) => p.id !== 'archivado');

function AdminCursos() {
  const { usuario } = useAuth();
  const esInstructor = usuario?.rol === 'profesor';
  const baseRuta = esInstructor ? '/panel-instructor' : '/admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // ?nuevo=1 abre la ventanita de "Nuevo curso" (también la usa la ruta vieja /cursos/nuevo)
  const nuevoAbierto = searchParams.get('nuevo') === '1';
  const [categorias, setCategorias] = useState([]);
  function abrirNuevo() {
    setSearchParams((p) => { p.set('nuevo', '1'); return p; });
  }
  function cerrarNuevo() {
    setSearchParams((p) => { p.delete('nuevo'); return p; }, { replace: true });
  }
  useEffect(() => {
    if (!nuevoAbierto) return;
    // Categorías que ya se usan, para elegir sin tener que escribirlas
    listarCategoriasRequest().then(setCategorias).catch(() => {});
  }, [nuevoAbierto]);
  const busqueda = normalizarTexto((searchParams.get('buscar') || '').trim());

  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState('activo');
  const pestanas = esInstructor ? PESTANAS_INSTRUCTOR : PESTANAS;
  // Curso pendiente de confirmar para eliminar (se muestra el cartel).
  const [cursoAEliminar, setCursoAEliminar] = useState(null);
  useEffect(() => {
    if (cursoAEliminar === null) return undefined;
    function alTeclear(e) {
      if (e.key === 'Escape') setCursoAEliminar(null);
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [cursoAEliminar]);
  const [error, setError] = useState('');
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);
  const [orden, setOrden] = useState(null);

  useEffect(() => {
    cargarCursos();
  }, [pestana]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarCursos() {
    try {
      const data = await listarCursosAdminRequest({ estado: pestana });
      setCursos(data);
    } catch (err) {
      setError('Error al cargar los cursos');
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarEstado(curso, nuevoEstado) {
    setCambiandoEstadoId(curso.id);
    try {
      const actualizado = await cambiarEstadoCursoRequest(curso.id, nuevoEstado);
      setCursos((prev) => prev.map((c) => (c.id === curso.id ? { ...c, estado: actualizado.estado } : c)));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar el estado del curso');
    } finally {
      setCambiandoEstadoId(null);
    }
  }

  // Archivar = borrado lógico: el curso sale de las listas y del catálogo,
  // pero se puede restaurar. Quien lo compró sigue teniendo acceso.
  async function handleArchivar(curso) {
    setCursoAEliminar(null);
    setCambiandoEstadoId(curso.id);
    try {
      await archivarCursoRequest(curso.id);
      setCursos((prev) => prev.filter((c) => c.id !== curso.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al archivar el curso');
    } finally {
      setCambiandoEstadoId(null);
    }
  }

  // Restaurar: vuelve como "oculto" (no aparece en el catálogo hasta que se active)
  async function handleRestaurar(curso) {
    setCambiandoEstadoId(curso.id);
    try {
      await cambiarEstadoCursoRequest(curso.id, 'oculto');
      setCursos((prev) => prev.filter((c) => c.id !== curso.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al restaurar el curso');
    } finally {
      setCambiandoEstadoId(null);
    }
  }

  if (cargando && cursos.length === 0) return <SkeletonListaAdmin />;
  if (error) return <div className="admin-dash-estado admin-dash-estado--error">{error}</div>;

  const cursosVisibles = ordenar(
    busqueda
      ? cursos.filter((c) => normalizarTexto(c.titulo).includes(busqueda) || normalizarTexto(c.categoria).includes(busqueda))
      : cursos,
    orden,
    ORDEN_CURSOS
  );

  return (
    <>
    <div className="admin-page-header">
      <h2>{esInstructor ? 'Mis cursos' : 'Cursos'}</h2>
      <p className="admin-page-sub">
        {esInstructor
          ? 'Los cursos que creaste o que te asignaron.'
          : 'Creá, editá y publicá los cursos del catálogo.'}
      </p>
    </div>
    <div className="admin-card admin-gestionar-cursos">
      <div className="admin-card-header">
        <h3 className="admin-card-titulo">
          {PESTANAS.find((p) => p.id === pestana).etiqueta}{' '}
          <span className="admin-dash-card-titulo-extra">({cursosVisibles.length})</span>
          {busqueda && <span className="admin-dash-card-titulo-extra"> · resultados para "{busqueda}"</span>}
        </h3>
        <div className="admin-card-acciones">
          <MenuOrden opciones={OPCIONES_CURSOS} orden={orden} onChange={setOrden} />
          <button type="button" className="admin-boton-primario" onClick={abrirNuevo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Crear curso nuevo
          </button>
        </div>
      </div>
      {(
        <div className="admin-filtros-barra admin-filtros-barra--card">
          <FiltroSegmentado
            className="admin-segmentado"
            etiqueta="Filtrar por estado"
            opciones={pestanas}
            valor={pestana}
            onCambiar={(id) => { setCargando(true); setPestana(id); }}
          />
        </div>
      )}
      {pestana === 'archivado' && (
        <p className="admin-card-nota">
          Los cursos archivados no aparecen en el catálogo ni en las listas. Quienes los compraron siguen teniendo acceso.
          Si un curso archivado no tiene ventas, se borra definitivamente a los 60 días.
        </p>
      )}
      {esInstructor && (
        <p className="admin-card-nota">
          Publicar y archivar cursos lo hace el administrador.
        </p>
      )}
      {busqueda && cursosVisibles.length === 0 ? (
        <p className="admin-dash-vacio admin-dash-vacio--izq">No encontramos cursos que coincidan con "{busqueda}".</p>
      ) : (
        <TablaCursosAdmin
          cursos={cursosVisibles}
          onCambiarEstado={esInstructor ? undefined : handleCambiarEstado}
          onArchivar={esInstructor ? undefined : (curso) => setCursoAEliminar(curso)}
          onRestaurar={esInstructor ? undefined : handleRestaurar}
          cambiandoEstadoId={cambiandoEstadoId}
          baseRuta={baseRuta}
          vacio={`No hay cursos en "${PESTANAS.find((p) => p.id === pestana).etiqueta}".`}
        />
      )}

      {nuevoAbierto && (
        <ModalNuevoCurso
          categorias={categorias}
          onCerrar={cerrarNuevo}
          onCreado={(curso) => navigate(`${baseRuta}/cursos/${curso.id}/editar`, { replace: true, state: { recienCreado: true } })}
        />
      )}

      {cursoAEliminar !== null && (
        <div className="admin-modal-fondo" onClick={() => setCursoAEliminar(null)}>
          <div
            className="admin-modal admin-modal--confirmar admin-modal--advertencia"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-curso-eliminar-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-curso-eliminar-titulo" className="admin-modal-titulo">¿Archivar "{cursoAEliminar.titulo}"?</h3>
            <p className="admin-modal-texto">
              Deja de aparecer en el catálogo y en las listas. Quienes lo compraron siguen teniendo acceso.
              Lo podés restaurar desde la pestaña "Archivados".
            </p>
            <div className="admin-modal-acciones">
              <button type="button" className="admin-tabla-accion" autoFocus onClick={() => setCursoAEliminar(null)}>
                Cancelar
              </button>
              <button type="button" className="admin-tabla-accion admin-tabla-accion--peligro" onClick={() => handleArchivar(cursoAEliminar)}>
                Archivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default AdminCursos;

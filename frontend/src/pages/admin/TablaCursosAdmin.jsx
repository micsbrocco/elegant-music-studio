import { Link } from 'react-router-dom';
import { formatearMoneda } from './tablaAdmin';
import PortadaCurso from '../../components/PortadaCurso';

const DIAS_BORRADO_ARCHIVADOS = 60;

// Fecha en que un curso archivado sin ventas se borra definitivamente
function fechaBorrado(curso) {
  if (!curso.archivadoEn || (curso._count?.inscripciones ?? 0) > 0) return null;
  const fecha = new Date(new Date(curso.archivadoEn).getTime() + DIAS_BORRADO_ARCHIVADOS * 24 * 60 * 60 * 1000);
  return fecha.toLocaleDateString('es-AR');
}

function TablaCursosAdmin({
  cursos, onCambiarEstado, onArchivar, onRestaurar, cambiandoEstadoId, baseRuta = '/admin', vacio = 'Todavía no hay cursos creados.',
}) {
  if (cursos.length === 0) {
    return <p className="admin-dash-vacio admin-dash-vacio--izq">{vacio}</p>;
  }

  return (
    <div className="admin-tabla-wrap">
      <table className="admin-tabla-cursos admin-tabla-cursos--tarjetas">
        <thead>
          <tr>
            <th>Curso</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Alumnos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((curso) => (
            <tr key={curso.id}>
              <td className="celda-curso">
                <div className="admin-tabla-curso-celda">
                  <PortadaCurso curso={curso} className="admin-tabla-curso-thumb" />
                  <div>
                    <div className="admin-tabla-curso-titulo">{curso.titulo}</div>
                    {curso.nivel && <div className="admin-tabla-curso-meta">{curso.nivel}</div>}
                    {curso.revisionSolicitadaEn && curso.estado !== 'activo' && (
                      <span className="admin-tabla-pill admin-tabla-pill--pendiente admin-curso-revision">Pide publicación</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="celda-categoria"><span className="admin-tabla-pill">{curso.categoria}</span></td>
              <td className="admin-tabla-monto celda-precio">{formatearMoneda(curso.precio)}</td>
              <td className="celda-alumnos" data-etiqueta="alumnos">{curso._count?.inscripciones ?? 0}</td>
              <td className="celda-estado">
                {curso.estado === 'archivado' ? (
                  <span className="admin-tabla-pill admin-tabla-pill--archivado">Archivado</span>
                ) : !onCambiarEstado ? (
                  // Sin permiso para publicar/ocultar (instructor): solo se muestra el
                  // estado actual, de lectura, sin el switch ni el botón "Publicar".
                  <span className={`admin-tabla-pill ${curso.estado === 'activo' ? 'admin-tabla-pill--activo' : curso.estado === 'borrador' ? 'admin-tabla-pill--borrador' : ''}`}>
                    {curso.estado === 'activo' ? 'Activo' : curso.estado === 'oculto' ? 'Oculto' : 'Borrador'}
                  </span>
                ) : curso.estado === 'borrador' ? (
                  <span className="admin-tabla-pill admin-tabla-pill--borrador">Borrador</span>
                ) : (
                  <label className="admin-switch">
                    <input
                      type="checkbox"
                      checked={curso.estado === 'activo'}
                      disabled={cambiandoEstadoId === curso.id}
                      onChange={() => onCambiarEstado(curso, curso.estado === 'activo' ? 'oculto' : 'activo')}
                    />
                    <span className="admin-switch-track"><span className="admin-switch-thumb" /></span>
                    <span className="admin-switch-label">{curso.estado === 'activo' ? 'Activo' : 'Oculto'}</span>
                  </label>
                )}
                {curso.estado === 'archivado' && (
                  <div className="admin-tabla-curso-meta admin-tabla-nota-archivo">
                    {fechaBorrado(curso)
                      ? `Se borra el ${fechaBorrado(curso)} si no se restaura`
                      : 'Tiene ventas: no se borra nunca'}
                  </div>
                )}
              </td>
              <td className="celda-acciones">
                <div className="admin-tabla-acciones">
                  {curso.estado === 'archivado' ? (
                    onRestaurar && (
                      <button
                        type="button"
                        className="admin-tabla-accion admin-tabla-accion--contorno"
                        disabled={cambiandoEstadoId === curso.id}
                        onClick={() => onRestaurar(curso)}
                      >
                        Restaurar
                      </button>
                    )
                  ) : (
                    <>
                      <Link to={`${baseRuta}/cursos/${curso.id}/editar`} className="admin-tabla-accion">Editar</Link>
                      {onCambiarEstado && curso.estado === 'borrador' && (
                        <button
                          type="button"
                          className="admin-tabla-accion admin-tabla-accion--destacada"
                          disabled={cambiandoEstadoId === curso.id}
                          onClick={() => onCambiarEstado(curso, 'activo')}
                        >
                          Publicar
                        </button>
                      )}
                      {onArchivar && (
                        <button type="button" className="admin-tabla-accion admin-tabla-accion--peligro" onClick={() => onArchivar(curso)}>
                          Archivar
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaCursosAdmin;

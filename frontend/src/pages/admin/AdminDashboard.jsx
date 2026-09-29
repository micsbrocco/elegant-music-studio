import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerResumenRequest, listarAlumnosRequest, listarVentasRequest, descargarCsv } from '../../services/reporteService';

function AdminDashboard() {
  const [resumen, setResumen] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('resumen'); // "resumen" | "alumnos" | "ventas"

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [dataResumen, dataAlumnos, dataVentas] = await Promise.all([
        obtenerResumenRequest(),
        listarAlumnosRequest(),
        listarVentasRequest(),
      ]);
      setResumen(dataResumen);
      setAlumnos(dataAlumnos);
      setVentas(dataVentas);
    } catch (err) {
      setError('Error al cargar el dashboard');
    } finally {
      setCargando(false);
    }
  }

  if (cargando) return <p>Cargando dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Panel de Administrador</h2>
        <div>
          <Link to="/admin/cursos">
            <button>📚 Administrar cursos</button>
          </Link>
        </div>
      </div>

      {/* Cards de resumen */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <TarjetaMetrica titulo="Alumnos registrados" valor={resumen.totalAlumnos} icono="👥" />
        <TarjetaMetrica titulo="Cursos publicados" valor={resumen.totalCursos} icono="📚" />
        <TarjetaMetrica titulo="Inscripciones totales" valor={resumen.totalInscripciones} icono="📝" />
        <TarjetaMetrica titulo="Ingresos totales" valor={`$${resumen.ingresosTotales.toLocaleString('es-AR')}`} icono="💰" />
      </div>

      {/* Cursos más vendidos */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Cursos más vendidos</h3>
        {resumen.cursosMasVendidos.length === 0 ? (
          <p>Todavía no hay inscripciones registradas.</p>
        ) : (
          <table border="1" cellPadding="8" style={{ width: '100%', maxWidth: '500px' }}>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Inscripciones</th>
              </tr>
            </thead>
            <tbody>
              {resumen.cursosMasVendidos.map((c, i) => (
                <tr key={i}>
                  <td>{c.titulo}</td>
                  <td>{c.inscripciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tabs para alumnos / ventas */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setVista('alumnos')} disabled={vista === 'alumnos'}>Ver alumnos</button>
        {' '}
        <button onClick={() => setVista('ventas')} disabled={vista === 'ventas'}>Ver ventas</button>
      </div>

      {vista === 'alumnos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Alumnos</h3>
            <button onClick={() => descargarCsv('/reportes/alumnos/exportar', 'alumnos.xlsx')}>
                 ⬇️ Exportar Excel
            </button>
          </div>
          <table border="1" cellPadding="8" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Fecha de registro</th>
                <th>Cursos inscriptos</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre} {a.apellido}</td>
                  <td>{a.email}</td>
                  <td>{new Date(a.fechaRegistro).toLocaleDateString('es-AR')}</td>
                  <td>{a._count.inscripciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'ventas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Ventas</h3>
            <button onClick={() => descargarCsv('/reportes/ventas/exportar', 'ventas.xlsx')}>
                ⬇️ Exportar Excel
            </button>
          </div>
          <table border="1" cellPadding="8" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Curso</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id}>
                  <td>{v.alumno}</td>
                  <td>{v.curso}</td>
                  <td>${v.monto}</td>
                  <td>{v.estado}</td>
                  <td>{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TarjetaMetrica({ titulo, valor, icono }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem 1.5rem',
        minWidth: '180px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: '1.5rem' }}>{icono}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{valor}</div>
      <div style={{ color: '#666', fontSize: '0.9rem' }}>{titulo}</div>
    </div>
  );
}

export default AdminDashboard;
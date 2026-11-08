import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import RutaProtegida from './components/RutaProtegida';

import Home from './pages/Home';
import Cursos from './pages/Cursos';
import CursoDetalle from './pages/CursoDetalle';
import CursoAprender from './pages/CursoAprender';
import MisCursos from './pages/MisCursos';
import Carrito from './pages/Carrito';
import Favoritos from './pages/Favoritos';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import ResetearPassword from './pages/ResetearPassword';
import VerificarEmail from './pages/VerificarEmail';
import PagoResultado from './pages/PagoResultado';
import VerificarCertificado from './pages/VerificarCertificado';
import Proximamente from './pages/Proximamente';
import { useSitio } from './context/SitioContext';

import AdminLayout from './pages/admin/AdminLayout';
import AdminCursos from './pages/admin/AdminCursos';
import EditorCursoVivo from './pages/admin/EditorCursoVivo';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVentas from './pages/admin/AdminVentas';
import AdminPreguntas from './pages/admin/AdminPreguntas';
import AdminAlumnos from './pages/admin/AdminAlumnos';
import AdminInstructores from './pages/admin/AdminInstructores';
import AdminLandingEditor from './pages/admin/AdminLandingEditor';
import Footer from './components/Footer';
import Arrepentimiento from './pages/Arrepentimiento';
import ModalCuenta from './components/ModalCuenta';
import ModalCompras from './components/ModalCompras';

function App() {
  const location = useLocation();
  // Modo "Próximamente": catálogo, carrito y registro quedan cerrados al público
  const { cursosCerrados } = useSitio();
  const backgroundLocation = location.state && location.state.backgroundLocation;
  // Cuando hay una ventana abierta (login, Mi cuenta, Mis compras), la página de
  // fondo es la que decide si se muestra navbar/footer, no la URL de la ventana.
  const rutaFondo = (backgroundLocation || location).pathname;
  const enPanelAdmin = rutaFondo.startsWith('/admin') || rutaFondo.startsWith('/panel-instructor');
  // En la vista de cursada (/cursos/:id/aprender) no se muestra el footer.
  const enCursada = /^\/cursos\/[^/]+\/aprender/.test(rutaFondo);
  // Mi cuenta y Mis compras son ventanas: se abren siempre encima de otra página.
  const esVentanaCuenta = location.pathname === '/perfil' || location.pathname === '/mis-compras';
  // Páginas que usan todo el ancho (con margen lateral): la navbar y el footer
  // se alinean con su contenido en vez de quedar centrados.
  const anchoCompleto = /^\/cursos\/[^/]+$/.test(rutaFondo);
  return (
    <div className={`app-shell ${anchoCompleto ? 'app-shell--ancho' : ''}`}>
      {!enPanelAdmin && <Navbar />}
      <main className="app-main">
      <Routes location={backgroundLocation || location}>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/cursos" element={cursosCerrados ? <Proximamente /> : <Cursos />} />
        <Route path="/cursos/:id" element={<CursoDetalle />} />
        <Route path="/carrito" element={cursosCerrados ? <Proximamente /> : <Carrito />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={cursosCerrados ? <Proximamente /> : <Registro />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/resetear-password" element={<ResetearPassword />} />
        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/arrepentimiento" element={<Arrepentimiento />} />
        <Route path="/verificar" element={<VerificarCertificado />} />
        <Route path="/verificar/:codigo" element={<VerificarCertificado />} />

        {/* Retorno de Mercado Pago */}
        <Route path="/pago/exito" element={<RutaProtegida><PagoResultado estado="exito" /></RutaProtegida>} />
        <Route path="/pago/pendiente" element={<RutaProtegida><PagoResultado estado="pendiente" /></RutaProtegida>} />
        <Route path="/pago/error" element={<RutaProtegida><PagoResultado estado="error" /></RutaProtegida>} />

        {/* Alumno (logueado) */}
        <Route
          path="/cursos/:id/aprender"
          element={
            <RutaProtegida>
              <CursoAprender />
            </RutaProtegida>
          }
        />
        <Route
          path="/mis-cursos"
          element={
            <RutaProtegida>
              <MisCursos />
            </RutaProtegida>
          }
        />
        {/* Mi cuenta y Mis compras se abren como ventana (ver abajo). Si alguien entra
            directo por la URL, de fondo se muestra Mis cursos. */}
        <Route path="/perfil" element={<RutaProtegida><MisCursos /></RutaProtegida>} />
        <Route path="/mis-compras" element={<RutaProtegida><MisCursos /></RutaProtegida>} />
        {/* Certificados y Configuración se integraron a Mis cursos y a Mi cuenta:
            las direcciones viejas redirigen para que no queden links rotos. */}
        <Route path="/mis-certificados" element={<Navigate to="/mis-cursos" replace />} />
        <Route path="/configuracion" element={<Navigate to="/perfil" replace />} />
        <Route
          path="/favoritos"
          element={
            <RutaProtegida>
              <Favoritos />
            </RutaProtegida>
          }
        />

        {/* Panel Admin - layout con sidebar + topbar, todo dentro de una sola rama protegida */}
        <Route
          path="/admin"
          element={
            <RutaProtegida soloAdmin={true}>
              <AdminLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="ventas" element={<AdminVentas />} />
          <Route path="pagos" element={<Navigate to="../ventas" replace />} />
          <Route path="alumnos" element={<AdminAlumnos />} />
          <Route path="preguntas" element={<AdminPreguntas />} />
          <Route path="instructores" element={<AdminInstructores />} />
          <Route path="landing" element={<AdminLandingEditor />} />
          <Route path="cursos" element={<AdminCursos />} />
          <Route path="cursos/nuevo" element={<Navigate to="../cursos?nuevo=1" replace />} />
          <Route path="cursos/:id/editar" element={<EditorCursoVivo />} />
          <Route path="cursos/:id/editor" element={<EditorCursoVivo />} />
        </Route>

        {/* Panel del instructor - mismo layout, recortado a "Mis Cursos" */}
        <Route
          path="/panel-instructor"
          element={
            <RutaProtegida rolesPermitidos={['profesor']}>
              <AdminLayout modoInstructor />
            </RutaProtegida>
          }
        >
          <Route index element={<AdminCursos />} />
          <Route path="cursos" element={<AdminCursos />} />
          <Route path="preguntas" element={<AdminPreguntas />} />
          <Route path="cursos/nuevo" element={<Navigate to="../cursos?nuevo=1" replace />} />
          <Route path="cursos/:id/editar" element={<EditorCursoVivo />} />
          <Route path="cursos/:id/editor" element={<EditorCursoVivo />} />
        </Route>

      </Routes>
      </main>
      {!enPanelAdmin && !enCursada && <Footer />}
      {/* Ventanas que se abren encima de la página de fondo */}
      {(backgroundLocation || esVentanaCuenta) && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={cursosCerrados ? <Navigate to="/registro" replace /> : <Registro />} />
          <Route path="/perfil" element={<RutaProtegida><ModalCuenta /></RutaProtegida>} />
          <Route path="/mis-compras" element={<RutaProtegida><ModalCompras /></RutaProtegida>} />
          <Route path="*" element={null} />
        </Routes>
      )}
    </div>
  );
}

export default App;
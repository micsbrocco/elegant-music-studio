import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RutaProtegida from './components/RutaProtegida';

import Home from './pages/Home';
import Cursos from './pages/Cursos';
import CursoDetalle from './pages/CursoDetalle';
import CursoAprender from './pages/CursoAprender';
import MisCursos from './pages/MisCursos';
import Perfil from './pages/Perfil';
import Carrito from './pages/Carrito';
import Favoritos from './pages/Favoritos';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import ResetearPassword from './pages/ResetearPassword';

import AdminCursos from './pages/admin/AdminCursos';
import CursoForm from './pages/admin/CursoForm';
import AdminModulos from './pages/admin/AdminModulos';
import ModuloForm from './pages/admin/ModuloForm';
import AdminContenidos from './pages/admin/AdminContenidos';
import ContenidoForm from './pages/admin/ContenidoForm';
import AdminPreguntas from './pages/admin/AdminPreguntas';
import PreguntaForm from './pages/admin/PreguntaForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import Footer from './components/Footer';

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/cursos/:id" element={<CursoDetalle />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/resetear-password" element={<ResetearPassword />} />

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
        <Route
          path="/perfil"
          element={
            <RutaProtegida>
              <Perfil />
            </RutaProtegida>
          }
        />
        <Route
          path="/carrito"
          element={
            <RutaProtegida>
              <Carrito />
            </RutaProtegida>
          }
        />
        <Route
          path="/favoritos"
          element={
            <RutaProtegida>
              <Favoritos />
            </RutaProtegida>
          }
        />

        {/* Panel Admin - Cursos */}
        <Route
          path="/admin/cursos"
          element={
            <RutaProtegida soloAdmin={true}>
              <AdminCursos />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/cursos/nuevo"
          element={
            <RutaProtegida soloAdmin={true}>
              <CursoForm />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/cursos/:id/editar"
          element={
            <RutaProtegida soloAdmin={true}>
              <CursoForm />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/cursos/:cursoId/modulos"
          element={
            <RutaProtegida soloAdmin={true}>
              <AdminModulos />
            </RutaProtegida>
          }
        />

        {/* Panel Admin - Módulos */}
        <Route
          path="/admin/modulos/:id/editar"
          element={
            <RutaProtegida soloAdmin={true}>
              <ModuloForm />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/modulos/:moduloId/contenidos"
          element={
            <RutaProtegida soloAdmin={true}>
              <AdminContenidos />
            </RutaProtegida>
          }
        />

        {/* Panel Admin - Contenidos */}
        <Route
          path="/admin/contenidos/:id/editar"
          element={
            <RutaProtegida soloAdmin={true}>
              <ContenidoForm />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/contenidos/:contenidoId/preguntas"
          element={
            <RutaProtegida soloAdmin={true}>
              <AdminPreguntas />
            </RutaProtegida>
          }
        />

        {/* Panel Admin - Preguntas */}
        <Route
          path="/admin/preguntas/:id/editar"
          element={
            <RutaProtegida soloAdmin={true}>
              <PreguntaForm />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin"
          element={
            <RutaProtegida soloAdmin={true}>
              <AdminDashboard />
            </RutaProtegida>
          }
        />
        
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
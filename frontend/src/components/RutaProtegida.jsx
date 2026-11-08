import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// soloAdmin se mantiene por compatibilidad con las rutas que ya lo usaban.
// rolesPermitidos es más general: una lista de roles que pueden entrar
// (se usa para el panel de instructor, que no es ni admin ni alumno común).
function RutaProtegida({ children, soloAdmin = false, rolesPermitidos }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p>Cargando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (soloAdmin && usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RutaProtegida;
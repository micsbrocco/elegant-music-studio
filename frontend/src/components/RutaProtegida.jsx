import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RutaProtegida({ children, soloAdmin = false }) {
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

  return children;
}

export default RutaProtegida;
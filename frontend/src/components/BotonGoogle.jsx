import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { googleRequest } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { rutaInicioSegunRol } from '../utils/rutas';

// Botón "Continuar con Google" compartido por el login y el registro.
// Google devuelve un ID token (credential) y el backend lo verifica antes de
// crear la sesión. Si la cuenta no existe, se crea en el momento.
function BotonGoogle({ onError }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async function alRecibirCredencial(respuesta) {
    try {
      const data = await googleRequest(respuesta.credential);
      login(data.usuario, data.token);
      navigate(rutaInicioSegunRol(data.usuario));
    } catch (err) {
      onError?.(err.response?.data?.error || 'No se pudo iniciar sesión con Google');
    }
  }

  if (!clientId) {
    return (
      <button type="button" className="auth-google-btn" disabled title="Falta configurar VITE_GOOGLE_CLIENT_ID">
        Continuar con Google
      </button>
    );
  }

  return (
    <div className="auth-google-wrap">
      <GoogleLogin
        onSuccess={alRecibirCredencial}
        onError={() => onError?.('No se pudo iniciar sesión con Google')}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width="360"
        locale="es"
      />
    </div>
  );
}

export default BotonGoogle;

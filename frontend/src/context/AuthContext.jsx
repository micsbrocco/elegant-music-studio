import { createContext, useState, useContext, useEffect } from 'react';
import { guardarToken, renovarSesion, cerrarSesionServidor, esperarArranque } from '../services/api';

const AuthContext = createContext();

// La sesión ya no se guarda en localStorage: el navegador tiene una cookie
// httpOnly y, al abrir la página, se le pide al backend quién es el usuario.
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Restos de la versión anterior, que guardaba el token en el navegador
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    } catch {
      // sin storage no hay nada que limpiar
    }

    const promesa = renovarSesion().then((sesion) => {
      if (sesion) setUsuario(sesion.usuario);
      setCargando(false);
    });
    esperarArranque(promesa);
  }, []);

  // Actualiza solo algunos datos del usuario en sesión (por ejemplo, la foto
  // después de editar el perfil) sin tener que volver a iniciar sesión.
  function actualizarUsuario(cambios) {
    setUsuario((prev) => (prev ? { ...prev, ...cambios } : prev));
  }

  function login(usuarioData, token) {
    guardarToken(token);
    setUsuario(usuarioData);
  }

  function logout() {
    cerrarSesionServidor();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

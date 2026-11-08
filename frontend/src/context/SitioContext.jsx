import { createContext, useContext, useEffect, useState } from 'react';
import { obtenerSitioRequest, actualizarSitioRequest } from '../services/sitioService';
import { useAuth } from './AuthContext';

// Interruptor "Próximamente" (se prende y apaga desde el panel, en Página de inicio).
// cursosCerrados es true para el público: el admin y los instructores ven todo igual.
const SitioContext = createContext({ proximamente: false, cursosCerrados: false, cambiarProximamente: async () => {} });

export function SitioProvider({ children }) {
  const { usuario } = useAuth();
  const [proximamente, setProximamente] = useState(false);

  useEffect(() => {
    obtenerSitioRequest().then((d) => setProximamente(Boolean(d.proximamente))).catch(() => {});
  }, []);

  async function cambiarProximamente(valor) {
    const d = await actualizarSitioRequest(valor);
    setProximamente(Boolean(d.proximamente));
  }

  const esEquipo = usuario?.rol === 'admin' || usuario?.rol === 'profesor';
  const valor = { proximamente, cursosCerrados: proximamente && !esEquipo, cambiarProximamente };
  return <SitioContext.Provider value={valor}>{children}</SitioContext.Provider>;
}

export function useSitio() {
  return useContext(SitioContext);
}

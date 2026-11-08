import { useCallback, useEffect, useRef, useState } from 'react';

const ESPERA_MS = 900;

// Guardado automático de varias cosas a la vez (el curso, la clase abierta,
// cada bloque de texto), cada una con su propia "clave".
//
//   const { estado, marcar, programar, guardarTodo } = useAutoguardado(guardar);
//   marcar('curso', datos)     → lo que se acaba de cargar ya está guardado
//   programar('curso', datos)  → se guarda 900 ms después del último cambio
//   guardarTodo()              → guarda ya lo que esté pendiente (antes de publicar, etc.)
//
// guardar(clave, datos) es la función que de verdad llama al servidor.
// estado: 'guardado' | 'pendiente' | 'guardando' | 'error'
export default function useAutoguardado(guardar) {
  const [estado, setEstado] = useState('guardado');
  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;
  const ultimo = useRef(new Map()); // clave → JSON de lo último guardado
  const pendientes = useRef(new Map()); // clave → { datos, json, timer }
  const enCurso = useRef(0);

  const actualizarEstado = useCallback(() => {
    if (enCurso.current > 0) setEstado('guardando');
    else setEstado(pendientes.current.size > 0 ? 'pendiente' : 'guardado');
  }, []);

  const ejecutar = useCallback(async (clave) => {
    const p = pendientes.current.get(clave);
    if (!p) return;
    clearTimeout(p.timer);
    pendientes.current.delete(clave);
    enCurso.current += 1;
    setEstado('guardando');
    try {
      await guardarRef.current(clave, p.datos);
      ultimo.current.set(clave, p.json);
      enCurso.current -= 1;
      actualizarEstado();
    } catch (err) {
      enCurso.current -= 1;
      setEstado('error');
    }
  }, [actualizarEstado]);

  const marcar = useCallback((clave, datos) => {
    ultimo.current.set(clave, JSON.stringify(datos));
  }, []);

  const programar = useCallback((clave, datos) => {
    const json = JSON.stringify(datos);
    const previo = pendientes.current.get(clave);
    if (previo) clearTimeout(previo.timer);
    if (ultimo.current.get(clave) === json) {
      pendientes.current.delete(clave);
      actualizarEstado();
      return;
    }
    const timer = setTimeout(() => ejecutar(clave), ESPERA_MS);
    pendientes.current.set(clave, { datos, json, timer });
    setEstado('pendiente');
  }, [ejecutar, actualizarEstado]);

  const guardarTodo = useCallback(async () => {
    for (const clave of [...pendientes.current.keys()]) {
      // eslint-disable-next-line no-await-in-loop
      await ejecutar(clave);
    }
  }, [ejecutar]);

  // Al cerrar la pestaña con algo sin guardar: aviso del navegador.
  // Al salir de la pantalla: se manda igual lo pendiente.
  useEffect(() => {
    function antesDeCerrar(e) {
      if (pendientes.current.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', antesDeCerrar);
    return () => {
      window.removeEventListener('beforeunload', antesDeCerrar);
      pendientes.current.forEach((p, clave) => {
        clearTimeout(p.timer);
        guardarRef.current(clave, p.datos).catch(() => {});
      });
      pendientes.current.clear();
    };
  }, []);

  return { estado, marcar, programar, guardarTodo };
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmarPagoRequest } from '../services/pagoService';

const MENSAJES = {
  confirmando: {
    titulo: 'Confirmando tu pago…',
    texto: 'Esto tarda unos segundos.',
  },
  listo: {
    titulo: '¡Gracias por tu compra!',
    texto: 'Tu pago se acreditó y ya tenés acceso al curso.',
  },
  exito: {
    titulo: '¡Gracias por tu compra!',
    texto: 'Estamos confirmando tu pago. En unos instantes tu curso va a aparecer en "Mis cursos".',
  },
  pendiente: {
    titulo: 'Tu pago está pendiente',
    texto: 'Apenas Mercado Pago lo confirme, vas a recibir acceso al curso.',
  },
  error: {
    titulo: 'No se pudo completar el pago',
    texto: 'No se realizó ningún cobro. Podés intentarlo de nuevo cuando quieras.',
  },
};

// Mercado Pago vuelve acá con ?payment_id=... (o collection_id). Con ese número
// el backend confirma el pago y el alumno tiene el curso al instante.
function PagoResultado({ estado }) {
  const [params] = useSearchParams();
  const paymentId = params.get('payment_id') || params.get('collection_id');
  const [vista, setVista] = useState(estado !== 'error' && paymentId ? 'confirmando' : estado);
  const [idsCursos, setIdsCursos] = useState([]);

  useEffect(() => {
    if (estado === 'error' || !paymentId) return undefined;
    let cancelado = false;
    let intentos = 0;

    // Recién aprobado, Mercado Pago a veces tarda un momento en informarlo:
    // se reintenta unas veces antes de mostrar el mensaje de "estamos confirmando".
    async function confirmar() {
      intentos += 1;
      try {
        const datos = await confirmarPagoRequest(paymentId);
        if (cancelado) return;
        if (datos.estado === 'approved') {
          setIdsCursos(datos.idsCursos || []);
          setVista('listo');
          return;
        }
        if (datos.estado === 'rejected' || datos.estado === 'cancelled') {
          setVista('error');
          return;
        }
      } catch {
        // se reintenta abajo
      }
      if (cancelado) return;
      if (intentos < 5) setTimeout(confirmar, 2000);
      else setVista(estado);
    }

    confirmar();
    return () => { cancelado = true; };
  }, [estado, paymentId]);

  const { titulo, texto } = MENSAJES[vista];
  const unSoloCurso = vista === 'listo' && idsCursos.length === 1;

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2>{titulo}</h2>
      <p>{texto}</p>
      {vista !== 'confirmando' && (
        unSoloCurso ? (
          <Link to={`/cursos/${idsCursos[0]}/aprender`} className="btn btn-primary">Empezar el curso</Link>
        ) : (
          <Link to={vista === 'error' ? '/carrito' : '/mis-cursos'} className="btn btn-primary">
            {vista === 'error' ? 'Volver al carrito' : 'Ir a mis cursos'}
          </Link>
        )
      )}
    </div>
  );
}

export default PagoResultado;

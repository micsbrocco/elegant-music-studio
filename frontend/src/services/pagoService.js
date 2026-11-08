import api from './api';

// Le pide al backend la orden de pago y devuelve el link de Mercado Pago
export async function crearPreferenciaRequest(cursoIds) {
  const response = await api.post('/pagos/preferencia', { cursoIds });
  return response.data; // { initPoint }
}

export async function misComprasRequest() {
  const response = await api.get('/pagos/mis-compras');
  return response.data;
}

// Al volver de Mercado Pago: confirma el pago y da acceso al curso al instante
export async function confirmarPagoRequest(paymentId) {
  const response = await api.post('/pagos/confirmar', { paymentId });
  return response.data; // { estado, idsCursos }
}

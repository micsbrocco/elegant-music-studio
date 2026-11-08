export function formatearPrecio(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero);
}
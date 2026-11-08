const crypto = require('crypto');

// Verifica que el aviso (webhook) lo mandó Mercado Pago y no otra persona.
// Mercado Pago firma cada aviso con la "clave secreta" que muestra el panel de
// la aplicación (Webhooks → Configurar notificaciones). Esa clave va en
// MP_WEBHOOK_SECRET.
//
// Header x-signature: "ts=1704908010,v1=<hmac>"
// Se arma el texto "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" y se
// calcula HMAC-SHA256 con la clave. Si coincide con v1, el aviso es auténtico.
function firmaValida(req, dataId) {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) {
    // Sin clave configurada (desarrollo) no se puede verificar. En producción
    // se rechaza: es obligatorio configurarla.
    if (process.env.NODE_ENV === 'production') return false;
    return true;
  }

  const firma = req.get('x-signature') || '';
  const requestId = req.get('x-request-id') || '';
  const partes = Object.fromEntries(
    firma.split(',').map((p) => p.trim().split('=')).filter((p) => p.length === 2)
  );
  if (!partes.ts || !partes.v1) return false;

  // Si el id es alfanumérico, Mercado Pago lo firma en minúsculas
  const id = String(dataId || '').toLowerCase();
  let manifiesto = '';
  if (id) manifiesto += `id:${id};`;
  if (requestId) manifiesto += `request-id:${requestId};`;
  manifiesto += `ts:${partes.ts};`;

  const esperado = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { firmaValida };

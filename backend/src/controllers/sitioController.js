const { modoProximamente, cambiarModoProximamente } = require('../utils/modoSitio');

// Pública: el frontend la consulta al abrir la página
async function obtenerSitio(req, res) {
  try {
    res.json({ proximamente: await modoProximamente() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo leer la configuración del sitio' });
  }
}

// Solo admin: prende o apaga el modo "Próximamente"
async function actualizarSitio(req, res) {
  try {
    if (typeof req.body?.proximamente !== 'boolean') {
      return res.status(400).json({ error: 'Falta indicar si el sitio queda en "Próximamente"' });
    }
    await cambiarModoProximamente(req.body.proximamente);
    res.json({ proximamente: req.body.proximamente });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar la configuración del sitio' });
  }
}

module.exports = { obtenerSitio, actualizarSitio };

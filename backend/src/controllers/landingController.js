const prisma = require('../config/prisma');
const supabase = require('../config/supabase');

// Valores actuales de Home.jsx, usados como respaldo si todavía no se guardó nada
const CONTENIDO_POR_DEFECTO = {
  heroEtiquetas: [
    'Producción musical',
    'Producción audiovisual',
    'Sala de ensayo',
    'Grabaciones',
    'Audio',
    'Video',
    'Creación de contenido',
  ],
  // Fotos reales del estudio (están en frontend/public/estudio)
  heroFotos: [
    '/estudio/estudio-sesion.jpg',
    '/estudio/estudio-control.jpg',
    '/estudio/estudio-podcast.jpg',
    '/estudio/estudio-entrevista.jpg',
    '/estudio/estudio-claqueta.jpg',
  ],
  producciones: [
    { id: 'XWgX7HZybKI', titulo: 'Eterno Amor - Los Manseros (Cover)', descripcion: 'Sesión en vivo grabada en el estudio.' },
    { id: 'kZhuHyKA1lY', titulo: 'Vienes y te vas - William Luna (Cover)', descripcion: 'Grabación en vivo con banda completa.' },
    { id: '1hyeOXpPjI0', titulo: 'Making of — Imagine', descripcion: 'Detrás de escena de una producción con 13 cantantes.' },
  ],
  productorPrincipal: {
    nombre: 'Nombre del Productor',
    rol: 'Fundador & Productor Principal',
    bio: 'Productor musical con más de 10 años de trayectoria, especializado en mezcla y masterización. Fundador de Elegant Music Studio, dedicado a formar a la próxima generación de productores.',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format',
  },
  equipo: [
    {
      nombre: 'Minion 1',
      rol: 'Producción de Videos',
      bio: 'Soy minion 1 y me gusta editar videos, estudio sonorización y producción audiovisual',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format',
    },
    {
      nombre: 'Minion 2',
      rol: 'Mix y Mastering',
      bio: 'Soy minion 2 y me gusta editar videos, estudio sonorización y producción audiovisual',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format',
    },
  ],
};

// Público: lo consume Home.jsx
async function obtenerLanding(req, res) {
  try {
    const config = await prisma.configuracionLanding.findUnique({ where: { id: 1 } });
    res.json(config ? config.contenido : CONTENIDO_POR_DEFECTO);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el contenido de la landing' });
  }
}

// Solo admin: lo usa el editor del panel
async function actualizarLanding(req, res) {
  try {
    const { contenido } = req.body;
    if (!contenido || typeof contenido !== 'object') {
      return res.status(400).json({ error: 'Falta el contenido a guardar' });
    }

    const actualizado = await prisma.configuracionLanding.upsert({
      where: { id: 1 },
      update: { contenido },
      create: { id: 1, contenido },
    });

    res.json(actualizado.contenido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el contenido de la landing' });
  }
}

// Solo admin: sube una foto (hero, productor o equipo) y devuelve su URL pública
async function subirFotoLanding(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const extension = req.file.originalname.split('.').pop();
    const nombreArchivo = `landing-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from('perfiles')
      .upload(nombreArchivo, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (errorSubida) {
      console.error(errorSubida);
      return res.status(500).json({ error: 'Error al subir la imagen' });
    }

    const { data: dataPublica } = supabase.storage
      .from('perfiles')
      .getPublicUrl(nombreArchivo);

    res.json({ url: dataPublica.publicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
}

module.exports = { obtenerLanding, actualizarLanding, subirFotoLanding, CONTENIDO_POR_DEFECTO };

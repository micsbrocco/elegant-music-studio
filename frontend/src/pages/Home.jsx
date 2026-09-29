import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CatalogoCursos from '../components/CatalogoCursos';

// TODO: reemplazar por fotos reales del estudio
const FOTOS_HERO = [
  'https://images.unsplash.com/photo-1574517947730-55cb23e608c2?w=900&h=900&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1535406208535-1429839cfd13?w=900&h=900&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=900&h=900&fit=crop&auto=format',
];

const PRODUCCIONES = [
  { id: 'XWgX7HZybKI', titulo: 'Eterno Amor - Los Manseros (Cover)', descripcion: 'Sesión en vivo grabada en el estudio.' }, // TODO: ajustar texto
  { id: 'kZhuHyKA1lY', titulo: 'Vienes y te vas - William Luna (Cover)', descripcion: 'Grabación en vivo con banda completa.' }, // TODO: ajustar texto
  { id: '1hyeOXpPjI0', titulo: 'Making of — Imagine', descripcion: 'Detrás de escena de una producción con 13 cantantes.' }, // TODO: ajustar texto
];

// TODO: reemplazar por los datos reales del productor principal
const PRODUCTOR_PRINCIPAL = {
  nombre: 'Nombre del Productor',
  rol: 'Fundador & Productor Principal',
  bio: 'Productor musical con más de 10 años de trayectoria, especializado en mezcla y masterización. Fundador de Elegant Music Studio, dedicado a formar a la próxima generación de productores.',
  foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format',
};

// TODO: sumar acá al resto del equipo cuando esté definido (queda vacío por ahora)
const EQUIPO = [
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
];

function Home() {
  const [indiceFoto, setIndiceFoto] = useState(0);
  const [videoDestacado, ...videosSecundarios] = PRODUCCIONES;

  // Carrusel automático del hero
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceFoto((prev) => (prev + 1) % FOTOS_HERO.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, []);

  // Si se llega con un #anchor en la URL (ej: /#producciones), scrollea hasta ahí
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="container hero-inner">
          <div>
            <h1 className="font-display hero-title">
              <span className="hero-title-gold">Elegant Music Studio</span>
            </h1>

            <p className="hero-tagline">
              <em>Donde el sonido toma forma.</em>
            </p>

            <p className="hero-subtitle">
              Aprendé producción musical con cursos online, a tu ritmo, dictados por profesionales de la industria.
            </p>

            <div className="hero-actions">
              <Link to="/cursos" className="btn btn-primary hero-btn-primary">
                Explorar cursos
                <span className="hero-btn-arrow">→</span>
              </Link>
              <a href="/#producciones" className="hero-btn-secondary">
                Ver producciones
                <span className="hero-btn-arrow">↗</span>
              </a>
            </div>
          </div>

          <div className="hero-media-frame">
            <div className="hero-carousel">
              {FOTOS_HERO.map((foto, i) => (
                <img key={i} src={foto} alt="Estudio de producción musical" className={i === indiceFoto ? 'activa' : ''} />
              ))}
            </div>

            <div className="hero-carousel-controls">
              <div className="hero-dots">
                {FOTOS_HERO.map((_, i) => (
                  <button
                    key={i}
                    className={`hero-dot ${i === indiceFoto ? 'activo' : ''}`}
                    onClick={() => setIndiceFoto(i)}
                    aria-label={`Ir a la foto ${i + 1}`}
                    type="button"
                  />
                ))}
              </div>
              <div className="hero-arrows">
                <button
                  className="hero-arrow"
                  onClick={() => setIndiceFoto((prev) => (prev - 1 + FOTOS_HERO.length) % FOTOS_HERO.length)}
                  aria-label="Foto anterior"
                  type="button"
                >
                  ‹
                </button>
                <button
                  className="hero-arrow"
                  onClick={() => setIndiceFoto((prev) => (prev + 1) % FOTOS_HERO.length)}
                  aria-label="Foto siguiente"
                  type="button"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURSOS DESTACADOS */}
      <section id="cursos-destacados" className="section-cream" style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Catálogo</div>
              <h2 className="font-display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600, lineHeight: 1.15 }}>
                Cursos <em className="italic-gold" style={{ fontStyle: 'italic' }}>destacados.</em>
              </h2>
            </div>
            <Link to="/cursos" className="btn btn-outline" style={{ textDecoration: 'none' }}>
              Ver todos los cursos →
            </Link>
          </div>

          <CatalogoCursos limite={3} />
        </div>
      </section>

      {/* NUESTRAS PRODUCCIONES */}
      <section id="producciones" className="producciones-section">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Portfolio</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600, lineHeight: 1.15, marginBottom: 40, color: 'var(--color-warm-white)' }}>
            Nuestras <em className="italic-gold">producciones.</em>
          </h2>

          <div className="producciones-card producciones-featured">
            <div className="video-embed-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${videoDestacado.id}`}
                title={videoDestacado.titulo}
                allowFullScreen
              />
            </div>
            <div className="producciones-card-info">
              <div>
                <p className="producciones-card-titulo">{videoDestacado.titulo}</p>
                <p className="producciones-card-desc">{videoDestacado.descripcion}</p>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${videoDestacado.id}`}
                target="_blank"
                rel="noreferrer"
                className="producciones-card-link"
              >
                Ver en YouTube
                <span className="hero-btn-arrow">↗</span>
              </a>
            </div>
          </div>

          {/* Videos secundarios */}
          <div className="producciones-grid">
            {videosSecundarios.map((video, i) => (
              <div key={i} className="producciones-card">
                <div className="video-embed-wrap">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.titulo}
                    allowFullScreen
                  />
                </div>
                <div className="producciones-card-info">
                  <div>
                    <p className="producciones-card-titulo">{video.titulo}</p>
                    <p className="producciones-card-desc">{video.descripcion}</p>
                  </div>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="producciones-card-link"
                  >
                    Ver en YouTube
                    <span className="hero-btn-arrow">↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONOCÉ A NUESTRO EQUIPO */}
      <section id="nosotros" className="section-cream" style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ maxWidth: 640, marginBottom: 48 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Nuestro equipo</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600, lineHeight: 1.15, marginBottom: 16 }}>
              Conocé a <em className="italic-gold">nuestro equipo.</em>
            </h2>
            <p className="text-muted" style={{ fontSize: 16, lineHeight: 1.7 }}>
              Las personas detrás de cada producción y cada curso de Elegant Music Studio.
            </p>
          </div>

          {/* Productor principal, destacado */}
          <div className="productor-card">
            <div className="productor-card-foto">
              <img src={PRODUCTOR_PRINCIPAL.foto} alt={PRODUCTOR_PRINCIPAL.nombre} />
            </div>
            <div className="productor-card-info">
              <span className="productor-card-badge">Fundador</span>
              <h3 className="font-display productor-card-nombre">{PRODUCTOR_PRINCIPAL.nombre}</h3>
              <p className="productor-card-rol">{PRODUCTOR_PRINCIPAL.rol}</p>
              <p className="text-muted productor-card-bio">{PRODUCTOR_PRINCIPAL.bio}</p>
            </div>
          </div>

          {/* Resto del equipo, si hay */}
          {EQUIPO.length > 0 && (
            <>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '48px 0 24px' }}>
                Nuestro Equipo
              </h3>
              <div className="equipo-grid">
                {EQUIPO.map((persona, i) => (
                  <div key={i} className="equipo-card">
                    <div className="equipo-card-foto">
                      <img src={persona.foto} alt={persona.nombre} />
                    </div>
                    <div className="equipo-card-info">
                      <h4 className="font-display equipo-card-nombre">{persona.nombre}</h4>
                      <p className="equipo-card-rol">{persona.rol}</p>
                      <p className="text-muted equipo-card-bio">{persona.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="equipo-cta" style={{ marginTop: 48 }}>
            <div>
              <h4 className="font-display equipo-cta-titulo">¿Querés conocer nuestras instalaciones?</h4>
              <p className="equipo-cta-texto">Agendá una visita al estudio y conocé de cerca dónde se graban nuestros cursos.</p>
            </div>
            <a href="#" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              {/* TODO: reemplazar por el contacto real (WhatsApp, mail, formulario) */}
              Agendar visita
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '70px 0', background: 'var(--color-warm-white)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 600, lineHeight: 1.2, marginBottom: 10 }}>
              ¿Listo para empezar<br /><em className="italic-gold">tu próximo curso?</em>
            </h2>
            <p className="text-muted" style={{ fontSize: 15 }}>Creá tu cuenta gratis y accedé a todo nuestro catálogo.</p>
          </div>
          <Link to="/registro" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Registrarme ahora
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
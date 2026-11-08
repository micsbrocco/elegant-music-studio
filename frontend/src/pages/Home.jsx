import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CatalogoCursos from '../components/CatalogoCursos';
import Revelar from '../components/Revelar';
import { obtenerLandingRequest } from '../services/landingService';
import { useAuth } from '../context/AuthContext';
import HeroRombos from '../components/HeroRombos';
import { useSitio } from '../context/SitioContext';

// Respaldo por si todavía no se guardó nada desde el editor de landing, o si falla la carga
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
  // Fotos reales del estudio (frontend/public/estudio). Se usan si en el panel
  // no se cargaron otras.
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

function Home() {
  const location = useLocation();
  const { usuario } = useAuth();
  const { cursosCerrados } = useSitio();
  const [contenido, setContenido] = useState(CONTENIDO_POR_DEFECTO);
  const [indiceFoto, setIndiceFoto] = useState(0);

  // Las fotos vacías del panel no se muestran; si no hay ninguna, van las del estudio
  const fotosCargadas = (contenido.heroFotos || []).filter(Boolean);
  const FOTOS_HERO = fotosCargadas.length > 0 ? fotosCargadas : CONTENIDO_POR_DEFECTO.heroFotos;
  const ETIQUETAS_HERO = contenido.heroEtiquetas || CONTENIDO_POR_DEFECTO.heroEtiquetas;
  const PRODUCCIONES = contenido.producciones;
  const PRODUCTOR_PRINCIPAL = contenido.productorPrincipal;
  const EQUIPO = contenido.equipo;
  // Video que se reproduce en el reproductor grande: arranca en el primero (el
  // último subido) y cambia al tocar cualquiera de los de la grilla.
  const [videoActivo, setVideoActivo] = useState(0);
  const indiceActivo = videoActivo < PRODUCCIONES.length ? videoActivo : 0;
  const videoDestacado = PRODUCCIONES[indiceActivo];
  const videosSecundarios = PRODUCCIONES
    .map((video, indice) => ({ ...video, indice }))
    .filter((video) => video.indice !== indiceActivo);
  // Para que el video elegido arranque solo; el primero de todos no se reproduce al cargar.
  const [autoReproducir, setAutoReproducir] = useState(false);

  useEffect(() => {
    obtenerLandingRequest().then(setContenido).catch(() => {});
  }, []);

  // Carrusel automático del hero
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceFoto((prev) => (prev + 1) % FOTOS_HERO.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [FOTOS_HERO.length]);

  // Profundidad al scrollear: se guarda cuánto se scrolleó en la variable CSS
  // --hero-scroll del hero, y los estilos desplazan cada capa (luces de fondo, texto,
  // foto) a distinta velocidad. Se escribe directo en el elemento (sin estado de React)
  // para no volver a renderizar la página en cada scroll.
  const heroRef = useRef(null);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let pendiente = false;
    function actualizar() {
      pendiente = false;
      hero.style.setProperty('--hero-scroll', String(Math.min(window.scrollY, 1200)));
    }
    function alScrollear() {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    }
    actualizar();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  // Las etiquetas del hero se iluminan de a una, en orden, y después descansan un
  // instante antes de repetir. Se hace cambiando una clase directo en el DOM (sin
  // estado de React) para no volver a renderizar la página cada vez.
  const etiquetasRef = useRef(null);
  useEffect(() => {
    const fila = etiquetasRef.current;
    if (!fila || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const etiquetas = [...fila.children];
    if (etiquetas.length === 0) return undefined;
    let actual = -1;
    let intervalo;
    // Arranca cuando termina la animación de entrada de las etiquetas
    const inicio = setTimeout(() => {
      function paso() {
        etiquetas.forEach((el) => el.classList.remove('hero-etiqueta--activa'));
        // Un paso de más al final del recorrido: ninguna encendida, como pausa.
        actual = (actual + 1) % (etiquetas.length + 1);
        if (actual < etiquetas.length) etiquetas[actual].classList.add('hero-etiqueta--activa');
      }
      paso();
      intervalo = setInterval(paso, 1800);
    }, 1800);
    return () => {
      clearTimeout(inicio);
      clearInterval(intervalo);
      etiquetas.forEach((el) => el.classList.remove('hero-etiqueta--activa'));
    };
  }, [ETIQUETAS_HERO.length]);

  // Navegación dentro de la landing: con un #anchor (ej: /#producciones) scrollea hasta
  // esa sección; sin anchor (botón "Inicio", logo) vuelve arriba de todo. Corre cada vez
  // que se navega a esta página, aunque ya se esté en ella (location.key cambia).
  useEffect(() => {
    const suave = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) {
        const t = setTimeout(() => el.scrollIntoView({ behavior: suave, block: 'start' }), 100);
        return () => clearTimeout(t);
      }
    } else {
      window.scrollTo({ top: 0, behavior: suave });
    }
    return undefined;
  }, [location.hash, location.key]);

  return (
    <div>
      {/* HERO */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />
        <div className="hero-glow hero-glow-4" />
        <div className="hero-glow hero-glow-5" />
        <HeroRombos />

        <div className="container hero-inner">
          <div>
            <h1 className="font-display hero-title hero-anim hero-anim-1">
              <span className="hero-title-gold">Elegant Music Studio</span>
            </h1>

            <p className="hero-tagline hero-anim hero-anim-2">
              <em>Donde el sonido toma forma.</em>
            </p>

            <p className="hero-subtitle hero-anim hero-anim-3">
              Aprendé producción musical con cursos online, a tu ritmo, dictados por profesionales de la industria.
            </p>

            {ETIQUETAS_HERO.length > 0 && (
              <div className="hero-etiquetas-row" ref={etiquetasRef}>
                {ETIQUETAS_HERO.map((etiqueta, i) => (
                  <span
                    key={i}
                    className="hero-etiqueta hero-etiqueta-anim"
                    style={{ animationDelay: `${0.45 + i * 0.07}s` }}
                  >
                    {etiqueta}
                  </span>
                ))}
              </div>
            )}

            <div className="hero-actions hero-anim hero-anim-5">
              <Link to="/cursos" className="btn btn-primary hero-btn-primary">
                Explorar cursos
                <span className="hero-btn-arrow">→</span>
              </Link>
              <Link to="/#producciones" className="hero-btn-secondary">
                Ver producciones
                <span className="hero-btn-arrow">↗</span>
              </Link>
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

      {/* CURSOS DESTACADOS (en modo "Próximamente" muestra el aviso en lugar de los cursos) */}
      <section id="cursos-destacados" className="section-cream" style={{ padding: '80px 0 130px' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Revelar style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 className="font-display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600, lineHeight: 1.15 }}>
                Cursos <em className="italic-gold" style={{ fontStyle: 'italic' }}>destacados.</em>
              </h2>
            </div>
            {!cursosCerrados && (
              <Link to="/cursos" className="btn btn-outline" style={{ textDecoration: 'none', borderColor: 'var(--color-ink)' }}>
                Ver todos los cursos →
              </Link>
            )}
          </Revelar>

          {cursosCerrados ? (
            <Revelar className="landing-cursos-proximamente">
              <p className="font-display landing-cursos-proximamente-titulo">Próximamente</p>
              <p className="landing-cursos-proximamente-texto">Estamos preparando los cursos.</p>
            </Revelar>
          ) : (
            <CatalogoCursos estilo="moderno" limite={3} tresColumnas />
          )}
        </div>
      </section>

      {/* NUESTRAS PRODUCCIONES */}
      <section id="producciones" className="producciones-section">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Revelar>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600, lineHeight: 1.15, marginBottom: 40, color: 'var(--color-warm-white)' }}>
              Nuestras <em className="italic-gold">producciones.</em>
            </h2>
          </Revelar>

          {/* Reproductor grande a la izquierda y, a la derecha, una grilla de 2 x 2
              con el resto de los videos (miniaturas). Tocar una miniatura la pasa
              al reproductor grande. */}
          <div className={`producciones-layout producciones-layout--${videosSecundarios.length}`}>
            <Revelar className="producciones-card producciones-featured">
              <div className="video-embed-wrap">
                {indiceActivo === 0 && <span className="producciones-badge-destacado">Último video</span>}
                <iframe
                  key={videoDestacado.id}
                  src={`https://www.youtube.com/embed/${videoDestacado.id}${autoReproducir ? '?autoplay=1' : ''}`}
                  title={videoDestacado.titulo}
                  allow="autoplay; encrypted-media; picture-in-picture"
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
            </Revelar>

            {videosSecundarios.length > 0 && (
              <div className={`producciones-grid producciones-grid--${videosSecundarios.length}`}>
                {videosSecundarios.map((video, i) => (
                  <Revelar key={video.indice} retraso={i * 100} className="producciones-mini">
                    <button
                      type="button"
                      className="producciones-mini-boton"
                      onClick={() => { setAutoReproducir(true); setVideoActivo(video.indice); }}
                      aria-label={`Reproducir ${video.titulo}`}
                    >
                      <span className="producciones-mini-thumb">
                        <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" />
                        <span className="producciones-mini-play" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        </span>
                      </span>
                      <span className="producciones-mini-titulo">{video.titulo}</span>
                    </button>
                  </Revelar>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONOCÉ A NUESTRO EQUIPO */}
      <section id="nosotros" className="section-cream" style={{ padding: '80px 0' }}>
        <div className="container">
          <Revelar style={{ maxWidth: 640, marginBottom: 48 }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600, lineHeight: 1.15, marginBottom: 16 }}>
              Conocenos<em className="italic-gold"></em>
            </h2>
          </Revelar>

          {/* Productor principal, destacado: tarjeta oscura a todo el ancho,
              foto grande a la izquierda y la info sobre un fondo con brillo dorado */}
          <Revelar className="productor-card">
            <div className="productor-card-foto">
              {PRODUCTOR_PRINCIPAL.foto ? (
                <img src={PRODUCTOR_PRINCIPAL.foto} alt={PRODUCTOR_PRINCIPAL.nombre} />
              ) : (
                <span className="foto-inicial">{PRODUCTOR_PRINCIPAL.nombre?.[0]}</span>
              )}
            </div>
            <div className="productor-card-info">
              <span className="productor-card-badge">Fundador</span>
              <h3 className="font-display productor-card-nombre">{PRODUCTOR_PRINCIPAL.nombre}</h3>
              <p className="productor-card-rol">{PRODUCTOR_PRINCIPAL.rol}</p>
              <p className="productor-card-bio">{PRODUCTOR_PRINCIPAL.bio}</p>
            </div>
          </Revelar>

          {/* Resto del equipo, si hay: tarjetas sencillas con foto chica redonda */}
          {EQUIPO.length > 0 && (
            <div className="equipo-grid">
              {EQUIPO.map((persona, i) => (
                <Revelar key={i} retraso={(i % 3) * 100} className="equipo-card">
                  <div className="equipo-card-foto">
                    {persona.foto ? (
                      <img src={persona.foto} alt={persona.nombre} loading="lazy" />
                    ) : (
                      <span className="foto-inicial">{persona.nombre?.[0]}</span>
                    )}
                  </div>
                  <div className="equipo-card-info">
                    <h4 className="font-display equipo-card-nombre">{persona.nombre}</h4>
                    <p className="equipo-card-rol">{persona.rol}</p>
                    {persona.bio && <p className="equipo-card-bio">{persona.bio}</p>}
                  </div>
                </Revelar>
              ))}
            </div>
          )}

          {/* Visita al estudio: una foto del estudio de fondo que se oscurece hacia
              la izquierda, donde va el texto y el botón de WhatsApp */}
          <Revelar className="visita-cta" id="contacto">
            {FOTOS_HERO[1] || FOTOS_HERO[0] ? (
              <img className="visita-cta-foto" src={FOTOS_HERO[1] || FOTOS_HERO[0]} alt="" loading="lazy" />
            ) : null}
            <div className="visita-cta-contenido">
              <h3 className="font-display visita-cta-titulo">
                ¿Querés conocer <em className="italic-gold">nuestras instalaciones?</em>
              </h3>
              <p className="visita-cta-texto">
                Agendá una visita al estudio y conocé de cerca dónde se graban nuestros cursos.
              </p>
              <div className="visita-cta-datos">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  Tucumán, Argentina
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  Visitas con turno
                </span>
              </div>
              <a
                href="https://wa.me/5493813397678"
                target="_blank"
                rel="noreferrer"
                className="visita-cta-boton"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 01-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.41 9.41 0 012.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0012.04.63C5.76.63.65 5.74.65 12.02c0 2.01.52 3.97 1.52 5.7L.55 23.62l6.03-1.58a11.37 11.37 0 005.45 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z" />
                </svg>
                Agendar visita por WhatsApp
              </a>
            </div>
          </Revelar>
        </div>
      </section>

      {/* CTA final: centrado, con el ecualizador dorado animado a los costados */}
      <section className="cta-final">
        <div className="cta-final-eq cta-final-eq--izq" aria-hidden="true">
          {[40, 70, 55, 90, 62, 80, 45, 72].map((alto, i) => (
            <span key={i} style={{ height: `${alto}%`, animationDelay: `${(i % 4) * -0.4}s` }} />
          ))}
        </div>
        <div className="cta-final-eq cta-final-eq--der" aria-hidden="true">
          {[60, 85, 48, 75, 92, 58, 70, 42].map((alto, i) => (
            <span key={i} style={{ height: `${alto}%`, animationDelay: `${(i % 4) * -0.4}s` }} />
          ))}
        </div>

        <Revelar className="container cta-final-contenido">
          <h2 className="font-display cta-final-titulo">
            ¿Listo para empezar <em className="italic-gold">tu próximo curso?</em>
          </h2>
          <p className="cta-final-texto">
            {usuario
              ? 'Seguí aprendiendo con nuevos cursos de producción, mezcla y grabación.'
              : 'Creá tu cuenta gratis y accedé a todo nuestro catálogo.'}
          </p>
          <div className="cta-final-botones">
            {usuario ? (
              <Link to="/cursos" className="cta-final-btn cta-final-btn--principal">Explorar cursos →</Link>
            ) : (
              <>
                <Link to="/registro" state={{ backgroundLocation: location }} className="cta-final-btn cta-final-btn--principal">
                  Crear cuenta gratis
                </Link>
                <Link to="/cursos" className="cta-final-btn cta-final-btn--secundario">Ver cursos</Link>
              </>
            )}
          </div>
          <ul className="cta-final-beneficios">
            <li>Acceso de por vida</li>
            <li>Aprendé a tu ritmo</li>
            <li>Certificado al finalizar</li>
          </ul>
        </Revelar>
      </section>
    </div>
  );
}

export default Home;